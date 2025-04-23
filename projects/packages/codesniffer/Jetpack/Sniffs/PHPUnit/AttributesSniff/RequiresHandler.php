<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use InvalidArgumentException;
use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\RequiresFunction;
use PHPUnit\Framework\Attributes\RequiresMethod;
use PHPUnit\Framework\Attributes\RequiresOperatingSystem;
use PHPUnit\Framework\Attributes\RequiresOperatingSystemFamily;
use PHPUnit\Framework\Attributes\RequiresPhp;
use PHPUnit\Framework\Attributes\RequiresPhpExtension;
use PHPUnit\Framework\Attributes\RequiresPhpunit;
use PHPUnit\Framework\Attributes\RequiresSetting;

/**
 * Attribute/annotation handler for `@requires`.
 *
 * Note `PHPUnit\Framework\Attributes\RequiresPhpunitExtension` has no equivalent annotation, and so is not handled here.
 */
class RequiresHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_BOTH;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array(
			RequiresPhp::class,
			RequiresPhpExtension::class,
			RequiresSetting::class,
			RequiresPhpunit::class,
			RequiresFunction::class,
			RequiresMethod::class,
			RequiresOperatingSystem::class,
			RequiresOperatingSystemFamily::class,
		);
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@requires' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unhandled attribute class is somehow passed.
	 */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		switch ( $data['name'] ) {
			case RequiresPhp::class:
				$ret->type    = 'PHP';
				$ret->version = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'versionRequirement' );
				break;

			case RequiresPhpExtension::class:
				$ret->type = 'extension';
				$ret->ext  = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'extension' );
				if ( isset( $data['params'][2] ) ) {
					$ret->version = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'version' );
				}
				break;

			case RequiresSetting::class:
				$ret->type    = 'setting';
				$ret->setting = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'setting' );
				$ret->value   = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'value' );
				break;

			case RequiresPhpunit::class:
				$ret->type    = 'PHPUnit';
				$ret->version = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'versionRequirement' );
				break;

			case RequiresFunction::class:
				$ret->type     = 'function';
				$ret->function = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'functionName' );
				break;

			case RequiresMethod::class:
				$ret->type                       = 'method';
				list( $ret->class, $ret->alias ) = $this->parseAttributeClassParameter( $phpcsFile, $data, 1, 'className' );
				$ret->method                     = $this->parseAttributeStringParameter( $phpcsFile, $data, 2, 'methodName' );
				break;

			case RequiresOperatingSystem::class:
				$ret->type  = 'OS';
				$ret->regex = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'regularExpression' );
				break;

			case RequiresOperatingSystemFamily::class:
				$ret->type   = 'OSFAMILY';
				$ret->family = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, 'operatingSystemFamily' );
				break;

			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized attribute {$data['name']}" ); // @codeCoverageIgnore
		}

		return static::json_encode_no_nulls( $ret );
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$ret = (object) array();

		if ( str_starts_with( $data['content'], 'OS ' ) ) { // partial REGEX_REQUIRES_OS
			$ret->type  = 'OS';
			$ret->regex = trim( substr( $data['content'], 3 ) );
		} elseif ( str_starts_with( $data['content'], 'OSFAMILY ' ) ) { // partial REGEX_REQUIRES_OS
			$ret->type   = 'OSFAMILY';
			$ret->family = trim( substr( $data['content'], 9 ) );
		} elseif ( preg_match( '/^(?P<name>PHP(?:Unit)?)\s+(?P<value>[<>=!]{0,2}\s*[\d\.-]+(dev|(RC|alpha|beta)[\d\.])?|[\d\t \-.|~^]+)[ \t]*\r?$/m', $data['content'], $m ) ) { // REGEX_REQUIRES_VERSION or REGEX_REQUIRES_VERSION_CONSTRAINT
			$ret->type    = $m['name'];
			$ret->version = $m['value'];
		} elseif ( preg_match( '/^setting\s+(?P<setting>[^ ]+?)\s*(?P<value>(?<=\s).*?)?[ \t]*\r?$/m', $data['content'], $m ) ) { // REGEX_REQUIRES_SETTING, but less broken
			$ret->type    = 'setting';
			$ret->setting = $m['setting'];
			$ret->value   = $m['value'] ?? '';
		} elseif ( preg_match( '/^extension\s+(?P<value>[^\s<>=!]+)\s*(?P<version>[<>=!]{0,2}\s*[\d\.-]+[\d\.]?)?[ \t]*\r?$/m', $data['content'], $m ) ) { // partial REGEX_REQUIRES
			$ret->type = 'extension';
			$ret->ext  = $m['value'];
			if ( isset( $m['version'] ) && $m['version'] !== '' ) {
				$ret->version = $m['version'];
			}
		} elseif ( preg_match( '/^function\s+(?P<class>[^\s<>=!:]+)::(?P<method>[^\s<>=!]+)[ \t]*\r?$/m', $data['content'], $m ) ) { // partial REGEX_REQUIRES
			$ret->type                       = 'method';
			list( $ret->class, $ret->alias ) = $this->parseAnnotationClass( $phpcsFile, $data, $m['class'] );
			$ret->method                     = $m['method'];
		} elseif ( preg_match( '/^function\s+(?P<value>[^\s<>=!]+)[ \t]*\r?$/m', $data['content'], $m ) ) { // partial REGEX_REQUIRES
			$ret->type     = 'function';
			$ret->function = $m['value'];
		} else {
			$phpcsFile->addError(
				'Failed to parse `%s` annotation.',
				$data['ptr'],
				'InvalidAnnotation',
				array( $data['name'] )
			);
			return null;
		}

		return json_encode( $ret );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->type` is somehow passed.
	 */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		$class  = null;
		$params = array();
		switch ( $d->type ) {
			case 'OS':
				$class    = RequiresOperatingSystem::class;
				$params[] = var_export( $d->regex, true );
				break;
			case 'OSFAMILY':
				$class    = RequiresOperatingSystemFamily::class;
				$params[] = var_export( $d->family, true );
				break;
			case 'PHP':
				$class    = RequiresPhp::class;
				$params[] = var_export( $d->version, true );
				break;
			case 'PHPUnit':
				$class    = RequiresPhpunit::class;
				$params[] = var_export( $d->version, true );
				break;
			case 'setting':
				$class    = RequiresSetting::class;
				$params[] = var_export( $d->setting, true );
				$params[] = var_export( $d->value, true );
				break;
			case 'extension':
				$class    = RequiresPhpExtension::class;
				$params[] = var_export( $d->ext, true );
				if ( isset( $d->version ) ) {
					$params[] = var_export( $d->version, true );
				}
				break;
			case 'function':
				$class    = RequiresFunction::class;
				$params[] = var_export( $d->function, true );
				break;
			case 'method':
				$class    = RequiresMethod::class;
				$params[] = $d->alias . '::class';
				$params[] = var_export( $d->method, true );
				break;
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}

		return array( $class, '( ' . implode( ', ', $params ) . ' )' );
	}

	/**
	 * {@inheritdoc}
	 *
	 * @throws InvalidArgumentException If an unknown `$data->type` is somehow passed.
	 */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$d = json_decode( $data );

		switch ( $d->type ) {
			case 'OS':
				return array( '@requires', " OS $d->regex" );
			case 'OSFAMILY':
				return array( '@requires', " OSFAMILY $d->family" );
			case 'PHP':
			case 'PHPUnit':
				return array( '@requires', " $d->type $d->version" );
			case 'setting':
				return array( '@requires', " setting $d->setting $d->value" );
			case 'extension':
				return array( '@requires', " extension $d->ext" . ( isset( $d->version ) ? " $d->version" : '' ) );
			case 'function':
				return array( '@requires', " function $d->function" );
			case 'method':
				return array( '@requires', " function \\$d->class::$d->method" );
			default:
				// Should never happen.
				throw new InvalidArgumentException( "Unrecognized data type $d->type" ); // @codeCoverageIgnore
		}
	}
}
