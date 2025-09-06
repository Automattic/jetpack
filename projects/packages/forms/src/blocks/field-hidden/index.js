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
	description: __(
		'Invisible to site visitors. Allows you to store extra values with each form submission.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: unseen,
	},
	edit,
	save,
	attributes: {
		default: { type: 'string', default: '' },
		label: { type: 'string', default: '' },
		urlParameter: { type: 'string', default: '' },
		valueSource: { type: 'string', default: 'manual' },
	},
	example: {
		attributes: {
			label: __( 'Company_ID', 'jetpack-forms' ),
			default: __( 'ACME Inc.', 'jetpack-forms' ),
			valueSource: 'manual',
		},
	},
};

export default {
	name,
	settings,
};
