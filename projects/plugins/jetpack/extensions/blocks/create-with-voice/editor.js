import { __, _x } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	title: __( 'Create with voice', 'jetpack' ),
	description: __(
		'Transform your spoken words into publish-ready blocks with AI effortlessly.',
		'jetpack'
	),
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'AL', 'block search term', 'jetpack' ),
		_x( 'Magic', 'block search term', 'jetpack' ),
		_x( 'help', 'block search term', 'jetpack' ),
		_x( 'assistant', 'block search term', 'jetpack' ),
	],
	edit,
	save: () => null,
} );
