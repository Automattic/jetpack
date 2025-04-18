<?php
/**
 * Attribute/annotation handler for AttributesSniff.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit\AttributesSniff;

use PHP_CodeSniffer\Files\File;

/**
 * Attribute/annotation handler for attributes/annotations where the annotation has a (usually pointless) "enabled" property.
 */
class EnabledParamHandler extends GenericHandler {

	/**
	 * Whether the attribute has a corresponding boolean parameter.
	 *
	 * @var bool
	 */
	protected $attributeHasParam;

	/**
	 * Constructor.
	 *
	 * @param int      $applies Where the attribute/annotation applies.
	 * @param string[] $annotations Annotation tags.
	 * @param string[] $attributes Attribute classes.
	 * @param bool     $attributeHasParam Whether the attribute has a corresponding boolean parameter.
	 */
	public function __construct( $applies, array $annotations, array $attributes, $attributeHasParam = false ) {
		parent::__construct( $applies, $annotations, $attributes );
		$this->attributeHasParam = $attributeHasParam;
	}

	/** {@inheritdoc} */
	public function parseAttribute( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $this->attributeHasParam ) {
			return 1;
		}

		if ( ! isset( $data['params'][1] ) ) {
			$this->addAttributeMissingParameterError( $phpcsFile, $data, 'enabled' );
			return null;
		}

		switch ( strtolower( $data['params'][1]['clean'] ) ) {
			case 'true':
				return 1;
			case 'false':
				return 0;
			case 'null':
			case '0': // @phan-suppress-current-line PhanPluginDuplicateSwitchCaseLooseEquality -- https://github.com/phan/phan/issues/3659
			case '""': // @phan-suppress-current-line PhanPluginDuplicateSwitchCaseLooseEquality -- https://github.com/phan/phan/issues/3659
			case "''": // @phan-suppress-current-line PhanPluginDuplicateSwitchCaseLooseEquality -- https://github.com/phan/phan/issues/3659
			case '"0"': // @phan-suppress-current-line PhanPluginDuplicateSwitchCaseLooseEquality -- https://github.com/phan/phan/issues/3659
			case "'0'": // @phan-suppress-current-line PhanPluginDuplicateSwitchCaseLooseEquality -- https://github.com/phan/phan/issues/3659
				$phpcsFile->addError(
					'Attribute `%s` requires a boolean value for its `$enabled` parameter.',
					$data['ptr'],
					'InvalidAttribute',
					array( preg_replace( '!.*\\\\!', '', $data['name'] ) )
				);
				return 0;
			default:
				$phpcsFile->addError(
					'Attribute `%s` requires a boolean value for its `$enabled` parameter.',
					$data['ptr'],
					'InvalidAttribute',
					array( preg_replace( '!.*\\\\!', '', $data['name'] ) )
				);
				// Still some possible falsey values (empty array and other numeric zeros), but it's not worth worrying about.
				return 1;
		}
	}

	/** {@inheritdoc} */
	public function parseAnnotation( File $phpcsFile, array $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! $this->attributeHasParam && $data['content'] !== 'enabled' ) {
			$phpcsFile->addError(
				"Annotation has no effect. To work, it must be `{$data['name']} enabled`.",
				$data['ptr'],
				'UselessAnnotation'
			);
			return null;
		}
		return (int) ( $data['content'] === 'enabled' );
	}

	/** {@inheritdoc} */
	protected function formatAttribute( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->attributes[0], $this->attributeHasParam ? ( $data ? '( true )' : '( false )' ) : '' );
	}

	/** {@inheritdoc} */
	protected function formatAnnotation( $data, $applies ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( $this->annotations[0], $data ? ' enabled' : ' disabled' );
	}
}
