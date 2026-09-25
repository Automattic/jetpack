/**
 * Field type icons for the dashboard.
 *
 * Icons are imported from their block icon definitions (src/blocks/field-* /icon.jsx).
 * For blocks that use `@wordpress/icons`, we import the icon directly to avoid
 * the extra `<Icon>` wrapper that some block icon files add.
 */

import { envelope, globe, mobile, unseen, upload } from '@wordpress/icons';
import checkboxUncheckedIcon from '../../../../blocks/field-checkbox/icon-unchecked.jsx';
import checkboxIcon from '../../../../blocks/field-checkbox/icon.jsx';
import consentIcon from '../../../../blocks/field-consent/icon.jsx';
import dateIcon from '../../../../blocks/field-date/icon.jsx';
import imageSelectIcon from '../../../../blocks/field-image-select/icon.tsx';
import multipleChoiceIcon from '../../../../blocks/field-multiple-choice/icon.jsx';
import nameIcon from '../../../../blocks/field-name/icon.jsx';
import numberIcon from '../../../../blocks/field-number/icon.jsx';
import ratingIcon from '../../../../blocks/field-rating/icon.jsx';
import selectIcon from '../../../../blocks/field-select/icon.jsx';
import singleChoiceIcon from '../../../../blocks/field-single-choice/icon.jsx';
import sliderIcon from '../../../../blocks/field-slider/icon.jsx';
import textIcon from '../../../../blocks/field-text/icon.jsx';
import textareaIcon from '../../../../blocks/field-textarea/icon.jsx';
import timeIcon from '../../../../blocks/field-time/icon.jsx';
import type { FieldType } from '../../../../types/index.ts';

/**
 * Map of field types to their icon definitions.
 * Custom SVG icons come from block icon files; `@wordpress/icons` are referenced directly.
 */
export const fieldIcons: Partial< Record< FieldType, JSX.Element > > = {
	checkbox: checkboxIcon.src,
	'checkbox-multiple': multipleChoiceIcon.src,
	consent: consentIcon.src,
	date: dateIcon.src,
	email: envelope,
	file: upload,
	hidden: unseen,
	'image-select': imageSelectIcon.src,
	name: nameIcon.src,
	number: numberIcon.src,
	phone: mobile,
	radio: singleChoiceIcon.src,
	range: sliderIcon.src,
	rating: ratingIcon.src,
	select: selectIcon.src,
	slider: sliderIcon.src,
	telephone: mobile,
	text: textIcon.src,
	textarea: textareaIcon.src,
	time: timeIcon.src,
	url: globe,
};

/**
 * Icon shown for a checkbox the respondent left unchecked.
 *
 * A checkbox field's icon reflects the answer, not just the type, so it can't
 * live in the type-keyed map above.
 */
export const checkboxUncheckedFieldIcon: JSX.Element = checkboxUncheckedIcon.src;

/**
 * Whether a submitted value means the respondent ticked the box.
 *
 * An unticked box submits an empty value, and some stored responses use an
 * explicit "No". The ticked value is a translated string ( "Yes" ), so this
 * tests for emptiness and the "no" sentinel rather than matching "yes".
 *
 * Must agree with `Feedback_Field::is_checked_value()` in PHP.
 *
 * @param value - The submitted value.
 * @return True when the box was ticked.
 */
export const isCheckedValue = ( value: unknown ): boolean => {
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	if ( value === null || value === undefined ) {
		return false;
	}
	const normalized = String( value ).trim().toLowerCase();
	return normalized !== '' && normalized !== '0' && normalized !== 'no';
};
