import { __ } from '@wordpress/i18n';
import { menu } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'dropdown';
const settings = {
	apiVersion: 3,
	title: __( 'Dropdown', 'jetpack-forms' ),
	description: __( 'Options for dropdown fields.', 'jetpack-forms' ),
	parent: [ 'jetpack/field-select' ],
	allowedBlocks: [ 'jetpack/dropdown-option' ],
	category: 'contact-form',
	icon: {
		foreground: getIconColor(),
		src: menu,
	},
	supports: {
		anchor: false,
		reusable: false,
		html: false,
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
