/**
 * Field type icons imported from block SVG files.
 * These icons are displayed next to field labels on the form submission confirmation page.
 *
 * The SVG files in src/blocks/{block-name}/icon.svg are the single source of truth.
 * PHP server-side rendering reads the same files from disk.
 */
import checkboxIcon from '../../blocks/field-checkbox/icon.svg?raw';
import consentIcon from '../../blocks/field-consent/icon.svg?raw';
import dateIcon from '../../blocks/field-date/icon.svg?raw';
import emailIcon from '../../blocks/field-email/icon.svg?raw';
import fileIcon from '../../blocks/field-file/icon.svg?raw';
import imageSelectIcon from '../../blocks/field-image-select/icon.svg?raw';
import checkboxMultipleIcon from '../../blocks/field-multiple-choice/icon.svg?raw';
import nameIcon from '../../blocks/field-name/icon.svg?raw';
import numberIcon from '../../blocks/field-number/icon.svg?raw';
import ratingIcon from '../../blocks/field-rating/icon.svg?raw';
import selectIcon from '../../blocks/field-select/icon.svg?raw';
import radioIcon from '../../blocks/field-single-choice/icon.svg?raw';
import sliderIcon from '../../blocks/field-slider/icon.svg?raw';
import phoneIcon from '../../blocks/field-telephone/icon.svg?raw';
import textIcon from '../../blocks/field-text/icon.svg?raw';
import textareaIcon from '../../blocks/field-textarea/icon.svg?raw';
import timeIcon from '../../blocks/field-time/icon.svg?raw';
import urlIcon from '../../blocks/field-url/icon.svg?raw';

/**
 * Map of field types to their raw SVG markup.
 */
const FIELD_TYPE_ICONS = {
	text: textIcon,
	textarea: textareaIcon,
	name: nameIcon,
	email: emailIcon,
	phone: phoneIcon,
	telephone: phoneIcon,
	url: urlIcon,
	date: dateIcon,
	time: timeIcon,
	number: numberIcon,
	select: selectIcon,
	radio: radioIcon,
	checkbox: checkboxIcon,
	'checkbox-multiple': checkboxMultipleIcon,
	file: fileIcon,
	rating: ratingIcon,
	consent: consentIcon,
	'image-select': imageSelectIcon,
	slider: sliderIcon,
};

/**
 * Returns the SVG HTML for a field type icon.
 *
 * @param {string} fieldType - The field type.
 * @return {string} The SVG HTML string.
 */
export function getFieldTypeIconHtml( fieldType ) {
	return FIELD_TYPE_ICONS[ fieldType ] || FIELD_TYPE_ICONS.text;
}
