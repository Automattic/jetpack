import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'simple-payment',
				attributes: {
					productId: {
						type: 'number',
						shortcode: ( { named: { id } } ) => {
							if ( ! id ) {
								return;
							}

							const result = parseInt( id, 10 );
							if ( result ) {
								return result;
							}
						},
					},
				},
			},
			{
				type: 'block',
				blocks: [ 'jetpack/simple-payments' ],
				transform: attributes => {
					// Remove the productId when duplicating
					const newAttributes = { ...attributes };
					delete newAttributes.productId;

					return createBlock( 'jetpack/simple-payments', newAttributes );
				},
			},
		],
	},
	deprecated: [ deprecatedV1, deprecatedV2 ],
} );
