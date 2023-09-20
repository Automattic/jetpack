import { __, _x } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save'; // TODO: Replace
import transforms from './transforms';

import './editor.scss';

const { variations } = metadata;
const docVariation = variations.find( ( { name } ) => name === 'jetpack/google-docs' );
const sheetsVariation = variations.find( ( { name } ) => name === 'jetpack/google-sheets' );
const slidesVariation = variations.find( ( { name } ) => name === 'jetpack/google-slides' );

docVariation.title = __( 'Google Docs', 'jetpack' );
docVariation.description = __( 'Embed a Google Document.', 'jetpack' );
docVariation.keywords = [
	_x( 'document', 'block search term', 'jetpack' ),
	_x( 'gsuite', 'block search term', 'jetpack' ),
	_x( 'doc', 'block search term', 'jetpack' ),
];

sheetsVariation.title = __( 'Google Sheets', 'jetpack' );
sheetsVariation.description = __( 'Embed a Google Sheet.', 'jetpack' );
sheetsVariation.keywords = [
	_x( 'sheet', 'block search term', 'jetpack' ),
	_x( 'spreadsheet', 'block search term', 'jetpack' ),
];

slidesVariation.title = __( 'Google Slides', 'jetpack' );
slidesVariation.description = __( 'Embed a Google Slides presentation.', 'jetpack' );
slidesVariation.keywords = [
	_x( 'slide', 'block search term', 'jetpack' ),
	_x( 'presentation', 'block search term', 'jetpack' ),
	_x( 'deck', 'block search term', 'jetpack' ),
];

registerJetpackBlockFromMetadata( metadata, {
	title: __( 'Google Docs (Beta)', 'jetpack' ),
	description: __( 'Embed a Google Document.', 'jetpack' ),
	keywords: [
		_x( 'document', 'block search term', 'jetpack' ),
		_x( 'gsuite', 'block search term', 'jetpack' ),
		_x( 'doc', 'block search term', 'jetpack' ),
	],
	edit,
	save,
	transforms: transforms( metadata.name ),
	variations,
} );
