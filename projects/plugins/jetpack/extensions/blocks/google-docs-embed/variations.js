import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'jetpack/google-docs',
		isDefault: true,
		title: __( 'Google Docs', 'jetpack' ),
		description: __( 'Embed a Google Document.', 'jetpack' ),
		icon: "<svg viewBox='0 0 64 88' width='24' height='24' xmlns='http://www.w3.org/2000/svg'><path d='M58,88H6c-3.3,0-6-2.7-6-6V6c0-3.3,2.7-6,6-6h36l22,22v60C64,85.3,61.3,88,58,88z' /><path fill='#FDFFFF' d='M42,0l22,22H42V0z' /><path fill='#FDFFFF' d='M50,39H14v-5h36V39z M50,46H14v5h36V46z M40,58H14v5h26V58z' /></svg>",
		keywords: [ __( 'document', 'jetpack' ), __( 'gsuite', 'jetpack' ), __( 'doc', 'jetpack' ) ],
		attributes: { variation: 'jetpack/google-docs' },
		isActive: [ 'variation' ],
	},
	{
		name: 'jetpack/google-sheets',
		isDefault: true,
		title: __( 'Google Sheets', 'jetpack' ),
		description: __( 'Embed a Google Sheet.', 'jetpack' ),
		icon: "<svg viewBox='0 0 64 88' width='24' height='24' xmlns='http://www.w3.org/2000/svg'><path d='M58,88H6c-3.3,0-6-2.7-6-6V6c0-3.3,2.7-6,6-6h36l22,22v60C64,85.3,61.3,88,58,88z' /><path fill='#FDFFFF' d='M42,0l22,22H42V0z' /><path fill='#FDFFFF' d='M12,34.5v28h40v-28H12z M17,39.5h12.5V46H17V39.5z M17,51h12.5v6.5H17V51z M47,57.5H34.5V51H47V57.5z M47,46 H34.5v-6.5H47V46z' /></svg>",
		keywords: [ __( 'sheet', 'jetpack' ), __( 'spreadsheet', 'jetpack' ) ],
		attributes: { variation: 'jetpack/google-sheets' },
		isActive: [ 'variation' ],
	},
	{
		name: 'jetpack/google-slides',
		isDefault: true,
		title: __( 'Google Slides', 'jetpack' ),
		description: __( 'Embed a Google Slides presentation.', 'jetpack' ),
		icon: "<svg viewBox='0 0 64 88' width='24' height='24' xmlns='http://www.w3.org/2000/svg'><path d='M58,88H6c-3.3,0-6-2.7-6-6V6c0-3.3,2.7-6,6-6h36l22,22v60C64,85.3,61.3,88,58,88z' /><path fill='#FDFFFF' d='M42,0l22,22H42V0z' /><path fill='#FDFFFF' d='M12,34.5v28h40v-28H12z M47,57.5H17v-18h30V57.5z' /></svg>",

		keywords: [
			__( 'slide', 'jetpack' ),
			__( 'presentation', 'jetpack' ),
			__( 'deck', 'jetpack' ),
		],
		attributes: { variation: 'jetpack/google-slides' },
		isActive: [ 'variation' ],
	},
].map( variation => ( { ...variation, icon: getBlockIconProp( variation ) } ) );

export default variations;
