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
	title: __( 'Email field', 'jetpack-forms' ),
	keywords: [ __( 'e-mail', 'jetpack-forms' ), __( 'mail', 'jetpack-forms' ), 'email' ],
	description: __( 'Collect email addresses from your visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ envelope } />,
	},
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Email', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'email',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
