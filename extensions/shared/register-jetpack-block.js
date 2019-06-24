/**
 * External dependencies
 */
import { endsWith } from 'lodash';
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import extensionList from '../index.json';
import getJetpackExtensionAvailability from './get-jetpack-extension-availability';
import wrapPaidBlock from './wrap-paid-block';

const betaExtensions = extensionList.beta || [];

function requiresPlan( unavailableReason ) {
	if ( endsWith( unavailableReason, '_plan_required' ) ) {
		return unavailableReason.substring( 0, unavailableReason.length - '_plan_required'.length );
	}
	return false;
}

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

	if ( ! available && ! requiresPlan( unavailableReason ) ) {
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
		edit: requiresPlan( unavailableReason ) ? wrapPaidBlock( settings.edit ) : settings.edit,
	} );

	// Register child blocks. Using `registerBlockType()` directly avoids availability checks -- if
	// their parent is available, we register them all, without checking for their individual availability.
	childBlocks.forEach( childBlock =>
		registerBlockType( `jetpack/${ childBlock.name }`, childBlock.settings )
	);

	return result;
}
