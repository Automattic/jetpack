/**
 * Field type icons imported from block SVG files.
 * These icons are displayed next to field labels on the form submission confirmation page.
 *
 * The SVG files in src/blocks/{block-name}/icon.svg are the single source of truth.
 * PHP server-side rendering reads the same files from disk.
 */
import checkboxUncheckedIcon from '../../blocks/field-checkbox/icon-unchecked.svg?raw';
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
 * Map of icon keys to their raw SVG markup.
 *
 * Keys are field types, except where a field's icon depends on the submitted
 * value as well as the type — see `getFieldTypeIconKey()`.
 */
const FIELD_TYPE_ICONS = {
	'checkbox:unchecked': checkboxUncheckedIcon,
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
 * Whether a submitted value means the respondent ticked the box.
 *
 * An unticked box submits an empty value, and some stored responses use an
 * explicit "No". The ticked value is a translated string ("Yes"), so this tests
 * for emptiness and the "no" sentinel rather than matching "yes".
 *
 * Must agree with `Feedback_Field::is_checked_value()` in PHP, which renders the
 * server-side icon for the same submission.
 *
 * @param {*} value - The submitted value.
 * @return {boolean} True when the box was ticked.
 */
function isCheckedValue( value ) {
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	if ( value === null || value === undefined ) {
		return false;
	}
	const normalized = String( value ).trim().toLowerCase();
	return normalized !== '' && normalized !== '0' && normalized !== 'no';
}

/**
 * Returns the icon key for a submitted field.
 *
 * Checkbox fields reflect the respondent's answer, so an unchecked box gets the
 * empty-square icon rather than the ticked one. Every other field type keys off
 * the type alone.
 *
 * @param {string} fieldType - The field type.
 * @param {*}      value     - The submitted value.
 * @return {string} The icon key.
 */
export function getFieldTypeIconKey( fieldType, value ) {
	if ( 'checkbox' === fieldType && ! isCheckedValue( value ) ) {
		return 'checkbox:unchecked';
	}
	return fieldType;
}

/**
 * Returns the SVG HTML for a field type icon.
 *
 * @param {string} fieldType - The field type.
 * @param {*}      value     - The submitted value.
 * @return {string} The SVG HTML string.
 */
export function getFieldTypeIconHtml( fieldType, value ) {
	return FIELD_TYPE_ICONS[ getFieldTypeIconKey( fieldType, value ) ] || FIELD_TYPE_ICONS.text;
}
