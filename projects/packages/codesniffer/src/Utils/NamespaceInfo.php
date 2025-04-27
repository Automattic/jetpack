<?php
/**
 * Utility class managing namespace info.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Files\File;
use PHPCSUtils\Internal\Cache;
use PHPCSUtils\Utils\Namespaces;
use PHPCSUtils\Utils\UseStatements;

/**
 * Utility class managing namespace info.
 */
class NamespaceInfo {

	/**
	 * Get namespace information for a token.
	 *
	 * Every token is part of a namespace, even an implicit one.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr The position in the stack where the token was found.
	 * @return array Namespace information.
	 *  - ptr: (?int) Stack pointer for the T_NAMESPACE token, if any.
	 *  - name: (string) Namespace name. May be the empty string.
	 *  - nsStart: (int) Stack pointer for the start of the "body" of the namespace. First T_OPEN_TAG if it's an implicit namespace, or 0 if none.
	 *  - nsEnd: (?int) Stack pointer for the end of the "body" of the namespace.
	 */
	public static function getNamespaceInfo( File $phpcsFile, $stackPtr ) {
		$nsptr = Namespaces::findNamespacePtr( $phpcsFile, $stackPtr );

		// Implicit namespace.
		if ( $nsptr === false ) {
			return array(
				'ptr'     => null,
				'name'    => '',
				// phpcs:ignore Universal.Operators.DisallowShortTernary.Found -- Used correctly.
				'nsStart' => $phpcsFile->findNext( T_OPEN_TAG, 0 ) ?: 0,
				'nsEnd'   => null,
			);
		}

		// @phan-suppress-next-line PhanAccessMethodInternal
		if ( Cache::isCached( $phpcsFile, __METHOD__, $nsptr ) ) {
			// @phan-suppress-next-line PhanAccessMethodInternal
			return Cache::get( $phpcsFile, __METHOD__, $nsptr );
		}

		$tokens = $phpcsFile->getTokens();
		$nsinfo = array(
			'ptr' => $nsptr,
		);

		$nsinfo['ptr']  = $nsptr;
		$nsname         = Namespaces::getDeclaredName( $phpcsFile, $nsptr );
		$nsinfo['name'] = $nsname === false ? '' : $nsname;
		if ( isset( $tokens[ $nsptr ]['scope_opener'] ) ) {
			$nsinfo['nsStart'] = $tokens[ $nsptr ]['scope_opener'];
			$nsinfo['nsEnd']   = $tokens[ $nsptr ]['scope_closer'];
		} else {
			$nsinfo['nsStart'] = $phpcsFile->findEndOfStatement( $nsptr );
			$nsinfo['nsEnd']   = null;
			$idx               = $nsinfo['nsStart'];
			// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional.
			while ( ( $idx = $phpcsFile->findNext( T_NAMESPACE, $idx + 1, null ) ) !== false ) {
				if ( Namespaces::isDeclaration( $phpcsFile, $idx ) ) {
					$nsinfo['nsEnd'] = $phpcsFile->findStartOfStatement( $idx ) - 1;
					break;
				}
			}
		}

		// @phan-suppress-next-line PhanAccessMethodInternal
		Cache::set( $phpcsFile, __METHOD__, $nsptr, $nsinfo );
		return $nsinfo;
	}

	/**
	 * Get class alias information for a namespace.
	 *
	 * @param File  $phpcsFile The file where the token was found.
	 * @param array $nsinfo As returned by `::getNamespaceInfo()`.
	 * @return array Mapping of aliases to fully qualified class names.
	 */
	public static function getClassAliases( File $phpcsFile, array $nsinfo ) {
		// @phan-suppress-next-line PhanAccessMethodInternal
		if ( Cache::isCached( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '' ) ) {
			// @phan-suppress-next-line PhanAccessMethodInternal
			return Cache::get( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '' );
		}

		$classAliases = array();
		$idx          = $nsinfo['nsStart'];
		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional.
		while ( ( $idx = $phpcsFile->findNext( T_USE, $idx + 1, $nsinfo['nsEnd'] ) ) !== false ) {
			if ( ! UseStatements::isImportUse( $phpcsFile, $idx ) ) {
				continue;
			}
			$info = UseStatements::splitImportUseStatement( $phpcsFile, $idx );
			foreach ( $info['name'] as $alias => $name ) {
				$classAliases[ $alias ] = '\\' . ltrim( $name, '\\' );
			}
		}

		// @phan-suppress-next-line PhanAccessMethodInternal
		Cache::set( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '', $classAliases );
		return $classAliases;
	}

	/**
	 * Fully-qualify a class name string.
	 *
	 * @param string $name Class name string.
	 * @param string $nsname Containing namespace name. Pass empty string for the base namespace.
	 * @param array  $aliases Map of class aliases to fully qualified class names.
	 * @return string Fully-qualified class name, with a leading backslash.
	 */
	public static function qualifyClassName( $name, $nsname, array $aliases ) {
		// Already qualified?
		if ( str_starts_with( $name, '\\' ) ) {
			return $name;
		}

		// Is a namespace operator?
		if ( str_starts_with( $name, 'namespace\\' ) ) {
			$name = substr( $name, 9 );
			if ( $nsname !== '' ) {
				$name = '\\' . $nsname . $name;
			}
			return $name;
		}

		// Known alias?
		$i = strpos( $name, '\\' );
		if ( $i !== false ) {
			$first = substr( $name, 0, $i );
			$rest  = substr( $name, $i );
		} else {
			$first = $name;
			$rest  = '';
		}
		if ( isset( $aliases[ $first ] ) ) {
			return $aliases[ $first ] . $rest;
		}

		// Otherwise, prefix the namespace (if any) and return it.
		if ( $nsname !== '' ) {
			$name = $nsname . '\\' . $name;
		}
		return '\\' . $name;
	}

	/**
	 * Abbreviate a fully-qualified class name string.
	 *
	 * @param string $name Fully-qualified class name string, leading backslash optional.
	 * @param string $nsname Containing namespace name. Pass empty string for the base namespace.
	 * @param array  $aliases Map of class aliases to fully qualified class names.
	 * @return string Abbreviated class name string, if possible. Leading backslash prepended if not possible.
	 */
	public static function unqualifyClassName( $name, $nsname, array $aliases ) {
		if ( ! str_starts_with( $name, '\\' ) ) {
			$name = '\\' . $name;
		}

		// Try removing the namespace prefix.
		if ( $nsname === '' ) {
			$unprefixed = substr( $name, 1 );
		} elseif ( str_starts_with( $name, '\\' . $nsname . '\\' ) ) {
			$unprefixed = substr( $name, strlen( $nsname ) + 2 );
		} else {
			$unprefixed = null;
		}
		// Skip if the shortened version is an alias though.
		if ( isset( $aliases[ $unprefixed ] ) ) {
			$unprefixed = null;
		}
		$unprefixedCt = $unprefixed === null ? INF : substr_count( $unprefixed, '\\' );

		// Check if any aliases exactly match or are a prefix. Prefer the one resulting in the fewest backslashes, if any have fewer than the above.
		foreach ( $aliases as $alias => $fqcn ) {
			if ( $name === $fqcn ) {
				return $alias;
			}
			if ( str_starts_with( $name, $fqcn . '\\' ) ) {
				$short = $alias . substr( $name, strlen( $fqcn ) );
				$ct    = substr_count( $short, '\\' );
				if ( $ct < $unprefixedCt ) {
					$unprefixed   = $short;
					$unprefixedCt = $ct;
				}
			}
		}

		if ( $unprefixed !== null ) {
			return $unprefixed;
		}

		// None of the above worked, just return the FQCN.
		return $name;
	}
}
