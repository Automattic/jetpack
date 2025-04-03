import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import { getIconColor } from '../contact-form/util/block-icons';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-url';
const settings = {
	...defaultSettings,
	title: __( 'Website Field', 'jetpack-forms' ),
	keywords: [
		__( 'url', 'jetpack-forms' ),
		__( 'internet page', 'jetpack-forms' ),
		__( 'link', 'jetpack-forms' ),
		__( 'website', 'jetpack-forms' ),
	],
	description: __( 'Collect a website address from your site visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ globe } />,
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		label: {
			type: 'string',
			default: 'Website',
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
