import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	// Transform from classic widget
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}
					return idBase === 'wpcom_instagram_widget';
				},
				transform: ( { instance } ) => {
					return createBlock( 'jetpack/instagram-gallery', {
						columns: instance.raw.columns,
						count: instance.raw.count,
						accessToken: instance.raw.token_id,
					} );
				},
			},
		],
	},
} );
