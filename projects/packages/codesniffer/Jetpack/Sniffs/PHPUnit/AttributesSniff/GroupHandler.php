<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Large;
use PHPUnit\Framework\Attributes\Medium;
use PHPUnit\Framework\Attributes\Small;
use PHPUnit\Framework\Attributes\Ticket;

/**
 * Attribute/annotation handler for `@group`, `@ticket`, `@large`, `@medium`, and `@small`.
 *
 * While PHPUnit's documentation claims `@group large` and the like is invalid, PHPUnit 11 treats them as identical.
 */
class GroupHandler extends Handler {

	/** {@inheritdoc} */
	public function applies() {
		return self::APPLIES_BOTH;
	}

	/** {@inheritdoc} */
	public function attributes() {
		return array( Group::class, Ticket::class, Large::class, Medium::class, Small::class );
	}

	/** {@inheritdoc} */
	public function annotations() {
		return array( '@group', '@ticket', '@large', '@medium', '@small' );
	}

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		switch ( $data['name'] ) {
			case Ticket::class:
				$prefix = 'T:';
				break;
			case Large::class:
				return 'G:large';
			case Medium::class:
				return 'G:medium';
			case Small::class:
				return 'G:small';
			default:
				$prefix = 'G:';
				break;
		}

		$group = $this->parseAttributeStringParameter( $phpcsFile, $data, 1, $prefix === 'T:' ? 'text' : 'name' );
		return $group === null ? null : "$prefix$group";
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		switch ( $data['name'] ) {
			case '@ticket':
				return 'T:' . $data['content'];
			case '@large':
			case '@medium':
			case '@small':
				return 'G:' . substr( $data['name'], 1 );
			default:
				return 'G:' . $data['content'];
		}
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) {
		// The Large, Medium, and Small attributes are marked as class-only for some reason.
		// So only return them at class level, and let Group handle method level.
		if ( $applies === self::APPLIES_CLASS && in_array( $data, array( 'G:large', 'G:medium', 'G:small' ), true ) ) {
			return array(
				match ( $data ) {
					'G:large'  => Large::class,
					'G:medium' => Medium::class,
					'G:small'  => Small::class,
				},
				'',
			);
		}

		return array(
			substr( $data, 0, 1 ) === 'T' ? Ticket::class : Group::class,
			sprintf( '( %s )', var_export( substr( $data, 2 ), true ) ),
		);
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$group = substr( $data, 2 );

		if ( in_array( $data, array( 'G:large', 'G:medium', 'G:small' ), true ) ) {
			return array( "@$group", '' );
		}

		return array(
			substr( $data, 0, 1 ) === 'T' ? '@ticket' : '@group',
			" $group",
		);
	}
}
