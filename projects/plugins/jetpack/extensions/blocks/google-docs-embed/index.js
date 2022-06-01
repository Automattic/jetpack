/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './view.scss';
import edit from './edit';
import save from '../p2-embed/save'; // TODO: Replace
import transforms from './transforms';

// Icons.
import docIcon from './google-doc-icon';
import sheetIcon from './google-sheet-icon';
import slideIcon from './google-slide-icon';
import { getIconColor } from '../../shared/block-icons';

export const name = 'google-docs-embed';
export const type = 'document';
export const patterns = [
	/^(http|https):\/\/(docs\.google.com)\/document\/d\/([A-Za-z0-9_-]+).*?$/i,
];

/**
 * Google Document block vars.
 */
export const GOOGLE_DOCUMENT = {
	type: 'document',
	title: __( 'Google Docs', 'jetpack' ),
	description: __( 'Embed a Google Document.', 'jetpack' ),
	name: 'google-docs',
	keywords: [
		_x( 'document', 'block search term', 'jetpack' ),
		_x( 'gsuite', 'block search term', 'jetpack' ),
		_x( 'doc', 'block search term', 'jetpack' ),
	],
	icon: {
		src: docIcon,
		foreground: getIconColor(),
	},
	patterns: [ /^(http|https):\/\/(docs\.google.com)\/document\/d\/([A-Za-z0-9_-]+).*?$/i ],
};

/**
 * Google Spreadsheet block vars.
 */
export const GOOGLE_SPREADSHEET = {
	type: 'spreadsheets',
	title: __( 'Google Sheets', 'jetpack' ),
	description: __( 'Embed a Google Sheet.', 'jetpack' ),
	name: 'google-sheets',
	keywords: [
		_x( 'sheet', 'block search term', 'jetpack' ),
		_x( 'spreadsheet', 'block search term', 'jetpack' ),
	],
	icon: {
		src: sheetIcon,
		foreground: getIconColor(),
	},
	patterns: [ /^(http|https):\/\/(docs\.google.com)\/spreadsheets\/d\/([A-Za-z0-9_-]+).*?$/i ],
};

/**
 * Google Slide block vars.
 */
export const GOOGLE_SLIDE = {
	type: 'presentation',
	title: __( 'Google Slides', 'jetpack' ),
	description: __( 'Embed a Google Slides presentation.', 'jetpack' ),
	name: 'google-slides',
	icon: {
		src: slideIcon,
		foreground: getIconColor(),
	},
	keywords: [
		_x( 'slide', 'block search term', 'jetpack' ),
		_x( 'presentation', 'block search term', 'jetpack' ),
		_x( 'deck', 'block search term', 'jetpack' ),
	],
	patterns: [ /^(http|https):\/\/(docs\.google.com)\/presentation\/d\/([A-Za-z0-9_-]+).*?$/i ],
};

export const settings = {
	title: __( 'Google Docs', 'jetpack' ),
	description: __( 'Embed a Google Document.', 'jetpack' ),
	keywords: [
		_x( 'document', 'block search term', 'jetpack' ),
		_x( 'gsuite', 'block search term', 'jetpack' ),
		_x( 'doc', 'block search term', 'jetpack' ),
	],
	category: 'embed',
	supports: {
		align: [ 'left', 'right', 'center', 'wide', 'full' ],
		anchor: true,
	},
	attributes: {
		url: {
			type: 'string',
			default: '',
		},
		aspectRatio: {
			type: 'string',
		},
		variation: {
			type: 'string',
		},
	},
	variations: [
		{
			name: GOOGLE_DOCUMENT.name,
			isDefault: true,
			title: GOOGLE_DOCUMENT.title,
			description: GOOGLE_DOCUMENT.description,
			icon: GOOGLE_DOCUMENT.description,
			attributes: { variation: 'google-docs' },
		},
		{
			name: GOOGLE_SPREADSHEET.name,
			isDefault: true,
			title: GOOGLE_SPREADSHEET.title,
			description: GOOGLE_SPREADSHEET.description,
			icon: GOOGLE_SPREADSHEET.description,
			attributes: { variation: 'google-sheets' },
		},
		{
			name: GOOGLE_SLIDE.name,
			isDefault: true,
			title: GOOGLE_SLIDE.title,
			description: GOOGLE_SLIDE.description,
			icon: GOOGLE_SLIDE.description,
			attributes: { variation: 'google-slides' },
		},
	],
	edit,
	save,
	transforms: transforms( name, patterns ),
};
