import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-hidden';
const settings = {
	...defaultSettings,
	title: __( 'Hidden field', 'jetpack-forms' ),
	description: __( 'Dynamically add values from the field.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ unseen } />,
	},
	edit,
	save,
	attributes: {
		label: { type: 'string', default: '' },
		default: { type: 'string', default: '' },
	},
	example: {
		attributes: {
			label: __( 'Company_ID', 'jetpack-forms' ),
			default: __( 'ACME Inc.', 'jetpack-forms' ),
		},
	},
};

export default {
	name,
	settings,
};
