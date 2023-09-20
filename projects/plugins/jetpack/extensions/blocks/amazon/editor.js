import { __, _x } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	title: __( 'Amazon (Beta)', 'jetpack' ),
	description: __( 'Promote Amazon products and earn a commission from sales.', 'jetpack' ),
	keywords: [
		_x( 'amazon', 'block search term', 'jetpack' ),
		_x( 'affiliate', 'block search term', 'jetpack' ),
	],
	edit,
	save: () => null, // TODO - add Amazon links
} );
