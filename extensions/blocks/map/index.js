/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import { settings as mapSettings } from './settings.js';
import edit from './edit';
import save from './save';
import deprecatedV1 from './deprecated/v1';
import './style.scss';
import './editor.scss';
export const { name } = mapSettings;
import { getIconColor } from '../../shared/block-icons';

export const settings = {
	title: mapSettings.title,
	icon: {
		src: mapSettings.icon,
		foreground: getIconColor(),
	},
	category: mapSettings.category,
	keywords: mapSettings.keywords,
	description: mapSettings.description,
	attributes: mapSettings.attributes,
	supports: mapSettings.supports,
	styles: mapSettings.styles,
	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== mapSettings.validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},
	edit,
	save,
	example: mapSettings.example,
	deprecated: [
		{
			attributes: omit( mapSettings.attributes, 'showFullscreenButton' ),
			migrate: attributes => ( { ...attributes, showFullscreenButton: true } ),
			save,
		},
		deprecatedV1,
	],
};
