import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../contact-form/util/render-material-icon';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-checkbox';
const settings = {
	...defaultSettings,
	title: __( 'Checkbox', 'jetpack-forms' ),
	keywords: [ __( 'Confirm', 'jetpack-forms' ), __( 'Accept', 'jetpack-forms' ) ],
	description: __( 'Confirm or select information with a single checkbox.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path
				fillRule="evenodd"
				d="M6.125 6H17.875C17.944 6 18 6.05596 18 6.125V17.875C18 17.944 17.944 18 17.875 18H6.125C6.05596 18 6 17.944 6 17.875V6.125C6 6.05596 6.05596 6 6.125 6ZM4.5 6.125C4.5 5.22754 5.22754 4.5 6.125 4.5H17.875C18.7725 4.5 19.5 5.22754 19.5 6.125V17.875C19.5 18.7725 18.7725 19.5 17.875 19.5H6.125C5.22754 19.5 4.5 18.7725 4.5 17.875V6.125ZM10.5171 16.4421L16.5897 8.71335L15.4103 7.78662L10.4828 14.0579L8.57616 11.7698L7.42383 12.7301L10.5171 16.4421Z"
			/>
		),
	},
	edit,
	attributes: {
		...defaultSettings.attributes,
		defaultValue: {
			type: 'string',
			default: '',
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-default-value': 'defaultValue',
	},
	deprecated,
	save,
	example: {
		attributes: { defaulValue: '' },
		innerBlocks: [
			{
				name: 'jetpack/option',
				attributes: {
					label: __( 'Option', 'jetpack-forms' ),
					isStandalone: true,
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
