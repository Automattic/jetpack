import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import defaultSettings from '../shared/settings';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'field-rating';
const settings = {
	...defaultSettings,
	title: __( 'Rating (stars)', 'jetpack-forms' ),
	description: __( 'Allow visitors to select a rating.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
		),
	},
	attributes: {
		...defaultSettings.attributes,
		maxRating: {
			type: 'number',
			default: 5,
			role: 'content',
		},
		maxrating: {
			type: 'number',
			default: 5,
			role: 'content',
		},
		defaultValue: {
			type: 'number',
			default: 0,
			role: 'content',
		},
		textAlign: { type: 'string', default: 'left' },
	},
	allowedBlocks: [ 'jetpack/label', 'jetpack/rating-input' ],
	supports: {
		...defaultSettings.supports,
		color: {
			text: true,
		},
		typography: {
			fontSize: true,
		},
	},
	edit,
	save,
	example: {
		attributes: {
			maxRating: 5,
			defaultValue: 3,
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Rate your experience', 'jetpack-forms' ),
				},
			},
		],
	},
};

export default { name, settings };
