import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import extensionList from '../index.json';

const betaExtensions = extensionList.beta || [];

function requiresPlan( unavailableReason, details ) {
	if ( unavailableReason === 'missing_plan' ) {
		return details.required_plan;
	}
	return false;
}

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name - The block's name.
 * @param {object} settings - The block's settings.
 * @param {object} childBlocks - The block's child blocks.
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [] ) {
	const { available, details, unavailableReason } = getJetpackExtensionAvailability( name );

	const requiredPlan = requiresPlan( unavailableReason, details );

	if ( ! available && ! requiredPlan ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ name } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const result = registerBlockType( `jetpack/${ name }`, {
		...settings,
		title: betaExtensions.includes( name ) ? `${ settings.title } (beta)` : settings.title,
		edit: settings.edit,
		example: requiredPlan ? undefined : settings.example,
	} );

	if ( 'production' !== process.env.NODE_ENV ) {
		// eslint-disable-next-line no-console
		console.log( `Block jetpack/${ name } registered.` );
	}

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( `jetpack/${ childBlock.name }`, childBlock.settings )
	);

	return result;
}
