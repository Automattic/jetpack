import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}

					return idBase === 'wpcom-goodreads';
				},
				transform: ( { instance } ) => {
					return createBlock( 'jetpack/goodreads', {
						customTitle: instance.raw.title,
						goodreadsId: parseInt( instance.raw.user_id ),
						shelfOption: instance.raw.shelf,
						showRating: false,
						widgetId: Math.floor( Math.random() * 9999999 ),
					} );
				},
			},
		],
	},
} );
