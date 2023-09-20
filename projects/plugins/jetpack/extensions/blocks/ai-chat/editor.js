import { __, _x } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';
import './components/feedback/style.scss';

registerJetpackBlockFromMetadata( metadata, {
	// The API version needs to be explicitly specified in this instance for styles to be loaded.
	apiVersion: metadata.apiVersion,
	title: __( 'AI Chat (Beta)', 'jetpack' ),
	description: __(
		'Provides summarized chat across a site’s content, powered by AI magic.',
		'jetpack'
	),
	keywords: [
		_x( 'AI', 'block search term', 'jetpack' ),
		_x( 'GPT', 'block search term', 'jetpack' ),
		_x( 'Chat', 'block search term', 'jetpack' ),
		_x( 'Search', 'block search term', 'jetpack' ),
	],
	edit,
	save,
} );
