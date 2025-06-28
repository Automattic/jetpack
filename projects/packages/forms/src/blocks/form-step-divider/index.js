import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';

export const name = 'form-step-divider';

export const settings = {
	apiVersion: 3,
	title: __( 'Step Divider', 'jetpack-forms' ),
	description: __( 'Split the current step into two steps.', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [ 'jetpack/form-step', 'jetpack/contact-form' ],
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon( <Path d="M19 13H5v-2h14v2z" /> ),
	},
	supports: {
		html: false,
		reusable: false,
	},
	edit: edit,
	save: () => null,
};

export default {
	name,
	settings,
};
