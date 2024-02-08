import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'jetpack-related-posts',
			},
		],
	},
} );
