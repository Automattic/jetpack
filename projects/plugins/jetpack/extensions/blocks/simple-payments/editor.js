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
		],
	},
	deprecated: [ deprecatedV1, deprecatedV2 ],
} );
