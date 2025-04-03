import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { mobile } from '@wordpress/icons';
import { getIconColor } from '../contact-form/util/block-icons';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-telephone';
const settings = {
	...defaultSettings,
	title: __( 'Phone Number Field', 'jetpack-forms' ),
	keywords: [
		__( 'Phone', 'jetpack-forms' ),
		__( 'Cellular phone', 'jetpack-forms' ),
		__( 'Mobile', 'jetpack-forms' ),
	],
	description: __( 'Collect phone numbers from site visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ mobile } />,
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		label: {
			type: 'string',
			default: 'Phone',
			role: 'content',
		},
	},
	deprecated,
	save,
};

export default {
	name,
	settings,
};
