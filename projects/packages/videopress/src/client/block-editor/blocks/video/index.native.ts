/**
 * External dependencies
 */
import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import metadata from './block.json';
import { VideoPressIcon as icon } from './components/icons';
import deprecated from './deprecated';
import Edit from './edit';
import transforms from './transforms';
import './style.scss';

export const { name, title, description, attributes } = metadata;

/**
 * Registers the VideoPress block if the availability requirements are met.
 *
 * @returns {object|boolean} Either false if the block is not available, or the results of `registerBlockType`
 */
export default function registerVideoPressBlock() {
	const { available } = getJetpackExtensionAvailability( name );
	const isDev = 'production' !== process.env.NODE_ENV;

	if ( ! available ) {
		isDev &&
			// eslint-disable-next-line no-console
			console.warn( `Block videopress/video couldn't be registered because it is unavailable.` );

		return false;
	}

	const result = registerBlockType( name, {
		edit: Edit,
		title,
		save: () => null,
		icon,
		attributes,
		transforms,
		deprecated,
	} );

	// eslint-disable-next-line no-console
	isDev && console.log( `Block videopress/video registered.` );

	return result;
}
