/**
 * External dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import extensionList from '../index.json';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';

const betaExtensions = extensionList.beta || [];

/**
 * Registers a gutenberg block if the availability requirements are met.
 *
 * @param {string} name The block's name.
 * @param {object} settings The block's settings.
 * @param {object} childBlocks The block's child blocks.
 * @returns {object|false} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerJetpackBlock( name, settings, childBlocks = [] ) {
	const { available, unavailableReason } = getJetpackExtensionAvailability( name );

	if ( ! available ) {
		if ( 'production' !== process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			console.warn(
				`Block ${ name } couldn't be registered because it is unavailable (${ unavailableReason }).`
			);
		}
		return false;
	}

	const result = registerBlockType(
		`jetpack/${ name }`,
		betaExtensions.includes( name )
			? { ...settings, title: `${ settings.title } (beta)` }
			: settings
	);

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( `jetpack/${ childBlock.name }`, childBlock.settings )
	);

	return result;
}
