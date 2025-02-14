import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../util/block-icons';
import renderMaterialIcon from '../../../util/render-material-icon';
import choiceItemSettings from '../../jetpack-field-choice/item/settings';
import edit from './edit';

const name = 'field-option-radio';
const settings = {
	...choiceItemSettings,
	title: __( 'Single Choice Option', 'jetpack-forms' ),
	parent: [ 'jetpack/field-radio' ],
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M7.5 13.5C6.67157 13.5 6 12.8284 6 12C6 11.1716 6.67157 10.5 7.5 10.5C8.32843 10.5 9 11.1716 9 12C9 12.8284 8.32843 13.5 7.5 13.5ZM4.5 12C4.5 13.6569 5.84315 15 7.5 15C9.15685 15 10.5 13.6569 10.5 12C10.5 10.3431 9.15685 9 7.5 9C5.84315 9 4.5 10.3431 4.5 12ZM12.5 12.75H20.5V11.25H12.5V12.75Z" />
		),
	},
	edit,
};

export default {
	name,
	settings,
};
