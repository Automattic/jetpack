import { __ } from '@wordpress/i18n';
import { lineSolid } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'dropdown-option';
const settings = {
	apiVersion: 3,
	title: __( 'Option', 'jetpack-forms' ),
	description: __( 'Option for dropdown fields.', 'jetpack-forms' ),
	parent: [ 'jetpack/dropdown' ],
	category: 'contact-form',
	icon: {
		foreground: getIconColor(),
		src: lineSolid,
	},
	attributes: { option: { type: 'string', default: '' } },
	supports: {
		anchor: false,
		customClassName: false,
		html: false,
		reusable: false,
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
