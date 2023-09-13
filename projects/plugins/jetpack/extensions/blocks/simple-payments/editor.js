import { __ } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';
import simplePaymentsExample1 from './simple-payments_example-1.jpg';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	example: {
		attributes: {
			price: 25.0,
			title: __( 'Jetpack t-shirt', 'jetpack' ),
			content: __(
				'Take flight in ultimate comfort with this stylish t-shirt featuring the Jetpack logo.',
				'jetpack'
			),
			email: 'jetpack@jetpack.com',
			featuredMediaUrl: simplePaymentsExample1,
		},
	},
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
