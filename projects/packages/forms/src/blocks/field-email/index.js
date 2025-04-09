import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import { getIconColor } from '../contact-form/util/block-icons';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-email';
const settings = {
	...defaultSettings,
	title: __( 'Email Field', 'jetpack-forms' ),
	keywords: [ __( 'e-mail', 'jetpack-forms' ), __( 'mail', 'jetpack-forms' ), 'email' ],
	description: __( 'Collect email addresses from your visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ envelope } />,
	},
	edit,
	deprecated,
	save,
};

export default {
	name,
	settings,
};
