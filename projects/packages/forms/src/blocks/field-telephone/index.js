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
	title: __( 'Phone number field', 'jetpack-forms' ),
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
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Phone', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'tel',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
