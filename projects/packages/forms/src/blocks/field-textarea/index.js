import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-textarea';
const settings = {
	...defaultSettings,
	title: __( 'Multi-line text field', 'jetpack-forms' ),
	keywords: [
		__( 'Textarea', 'jetpack-forms' ),
		'textarea',
		__( 'Multiline text', 'jetpack-forms' ),
	],
	description: __( 'Capture longform text responses from site visitors.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M20 5H4V6.5H20V5ZM5.5 11.5H18.5V18.5H5.5V11.5ZM20 20V10H4V20H20Z" />
		),
	},
	edit,
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Message', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input',
				attributes: {
					type: 'textarea',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
