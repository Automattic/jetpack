import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../util/block-icons';
import renderMaterialIcon from '../../../util/render-material-icon';
import choiceItemSettings from '../../jetpack-field-choice/item/settings';
import edit from './edit';

const name = 'field-option-checkbox';
const settings = {
	...choiceItemSettings,
	title: __( 'Multiple Choice Option', 'jetpack-forms' ),
	parent: [ 'jetpack/field-checkbox-multiple' ],
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<Path d="M5.5 10.5H8.5V13.5H5.5V10.5ZM8.5 9H5.5C4.67157 9 4 9.67157 4 10.5V13.5C4 14.3284 4.67157 15 5.5 15H8.5C9.32843 15 10 14.3284 10 13.5V10.5C10 9.67157 9.32843 9 8.5 9ZM12 12.75H20V11.25H12V12.75Z" />
		),
	},
	edit,
};

export default {
	name,
	settings,
};
