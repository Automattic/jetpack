import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../../../shared/render-material-icon';
import edit from './edit';
import save from './save';

const attributes = {
	name: {
		type: 'string',
		default: '',
	},
};

export const name = 'name';

export const settings = {
	title: __( 'Name', 'jetpack' ),
	description: __( 'Lets you add a name with Schema markup.', 'jetpack' ),
	keywords: [],
	// Same icon as the contact-info block
	icon: renderMaterialIcon(
		<Path d="M19 5v14H5V5h14m0-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 10H6v-1.53c0-2.5 3.97-3.58 6-3.58s6 1.08 6 3.58V18zm-9.69-2h7.38c-.69-.56-2.38-1.12-3.69-1.12s-3.01.56-3.69 1.12z" />
	),
	category: 'grow',
	attributes,
	parent: [ 'jetpack/contact-info' ],
	edit,
	save,
};
