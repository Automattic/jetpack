import { __ } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import imgExampleAfter from './img-example-after.png';
import imgExampleBefore from './img-example-before.png';
import save from './save';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	example: {
		attributes: {
			imageBefore: {
				id: 1,
				url: imgExampleBefore,
				alt: __( 'Before', 'jetpack' ),
			},
			imageAfter: {
				id: 2,
				url: imgExampleAfter,
				alt: __( 'After', 'jetpack' ),
			},
			caption: __( 'Example image', 'jetpack' ),
		},
	},
} );
