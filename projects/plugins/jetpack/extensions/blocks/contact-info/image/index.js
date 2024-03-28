import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../../../shared/render-material-icon';
import edit from './edit';
import save from './save';

const attributes = {
	image: {
		type: 'object',
		default: null,
	},
};

export const name = 'image';

export const settings = {
	title: __( 'Image', 'jetpack' ),
	description: __( 'Lets you add an image with Schema markup.', 'jetpack' ),
	keywords: [],
	icon: renderMaterialIcon(
		<Path d="M2.25 1h15.5c0.69 0 1.25 0.56 1.25 1.25v15.5c0 0.69-0.56 1.25-1.25 1.25h-15.5c-0.69 0-1.25-0.56-1.25-1.25v-15.5c0-0.69 0.56-1.25 1.25-1.25zM17 17v-14h-14v14h14zM10 6c0-1.1-0.9-2-2-2s-2 0.9-2 2 0.9 2 2 2 2-0.9 2-2zM13 11c0 0 0-6 3-6v10c0 0.55-0.45 1-1 1h-10c-0.55 0-1-0.45-1-1v-7c2 0 3 4 3 4s1-3 3-3 3 2 3 2z" />
	),
	category: 'grow',
	attributes,
	parent: [ 'jetpack/contact-info' ],
	edit,
	save,
};
