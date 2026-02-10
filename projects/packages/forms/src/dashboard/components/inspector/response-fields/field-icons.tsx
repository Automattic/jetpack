/**
 * Field type icons for the dashboard.
 *
 * Icons are imported from their block icon definitions (src/blocks/field-* /icon.jsx).
 * For blocks that use `@wordpress/icons`, we import the icon directly to avoid
 * the extra `<Icon>` wrapper that some block icon files add.
 */

import { envelope, globe, mobile, unseen, upload } from '@wordpress/icons';
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
	time: timeIcon,
	url: globe,
};
