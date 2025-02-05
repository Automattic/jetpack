import {
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
	requiresPaidPlan,
	getJetpackData,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string}  name        - The block's name.
 * @param {object}  settings    - The block's settings.
 * @param {object}  childBlocks - The block's child blocks.
 * @param {boolean} prefix      - Should this block be prefixed with `jetpack/`?
 * @return {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [], prefix = true ) {
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( name );
	const jetpackData = getJetpackData();
	const isExperimental = jetpackData?.blocks_variation === 'experimental';

	const requiredPlan = requiresPaidPlan( unavailableReason, details );
	const jpPrefix = prefix ? 'jetpack/' : '';

	if ( ! available && ! requiredPlan ) {
		// eslint-disable-next-line no-undef -- webpack sets process.env.NODE_ENV
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
	childBlocks.forEach( childBlock => {
		// Skip experimental blocks unless experimental variation is enabled
		if ( childBlock.settings?.isExperimental && ! isExperimental ) {
			return;
		}
		registerBlockType( jpPrefix + childBlock.name, childBlock.settings );
	} );

	return result;
}
