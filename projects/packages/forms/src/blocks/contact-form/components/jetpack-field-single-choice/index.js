import { Path } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../util/block-icons';
import renderMaterialIcon from '../../util/render-material-icon';
import choiceSettings from '../jetpack-field-choice/settings';
import edit from './edit';
import save from './save';

const name = 'field-radio';
const settings = {
	...choiceSettings,
	title: __( 'Single Choice (Radio)', 'jetpack-forms' ),
	keywords: [
		__( 'Choose', 'jetpack-forms' ),
		__( 'Select', 'jetpack-forms' ),
		__( 'Option', 'jetpack-forms' ),
	],
	description: __(
		'Offer users a list of choices, and allow them to select a single option.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Fragment>
				<Path d="M4 7.75C4 9.40685 5.34315 10.75 7 10.75C8.65685 10.75 10 9.40685 10 7.75C10 6.09315 8.65685 4.75 7 4.75C5.34315 4.75 4 6.09315 4 7.75ZM20 8.5H12V7H20V8.5ZM20 17H12V15.5H20V17ZM7 17.75C6.17157 17.75 5.5 17.0784 5.5 16.25C5.5 15.4216 6.17157 14.75 7 14.75C7.82843 14.75 8.5 15.4216 8.5 16.25C8.5 17.0784 7.82843 17.75 7 17.75ZM4 16.25C4 17.9069 5.34315 19.25 7 19.25C8.65685 19.25 10 17.9069 10 16.25C10 14.5931 8.65685 13.25 7 13.25C5.34315 13.25 4 14.5931 4 16.25Z" />
			</Fragment>
		),
	},
	edit,
	save,
	allowedBlocks: [ 'jetpack/field-option-radio' ],
	attributes: {
		label: {
			type: 'string',
			default: 'Choose one option',
		},
	},
};

export default {
	name,
	settings,
};
