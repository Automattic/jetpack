import {
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
	requiresPaidPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { InspectorControls } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { PanelBody } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name - The block's name.
 * @param {object} settings - The block's settings.
 * @param {object} childBlocks - The block's child blocks.
 * @param {boolean} prefix - Should this block be prefixed with `jetpack/`?
 * @param {string} customDescription - Custom description for the block.
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock(
	name,
	settings,
	childBlocks = [],
	prefix = true,
	customDescription = null
) {
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( name );

	const requiredPlan = requiresPaidPlan( unavailableReason, details );
	const jpPrefix = prefix ? 'jetpack/' : '';

	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ name } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const result = registerBlockType( jpPrefix + name, settings );

	if ( requiredPlan ) {
		addFilter(
			'editor.BlockListBlock',
			`${ jpPrefix + name }-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( jpPrefix + name )
		);
	}

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( jpPrefix + childBlock.name, childBlock.settings )
	);

	// If a custom description was passed, create a new element that we'll display below the block panel.
	if ( customDescription ) {
		const withCustomDescription = createHigherOrderComponent( BlockEdit => {
			return props => {
				return (
					<>
						<BlockEdit { ...props } />
						<InspectorControls>
							<PanelBody>{ customDescription }</PanelBody>
						</InspectorControls>
					</>
				);
			};
		}, 'withCustomDescription' );

		addFilter( 'editor.BlockEdit', `${ jpPrefix }${ name }-description`, withCustomDescription );
	}

	return result;
}
