import { __ } from '@wordpress/i18n';

export const ALLOWED_FORMATS = [ 'core/bold', 'core/italic' ];
export const ALLOWED_INNER_BLOCKS = [ 'jetpack/label', 'jetpack/input' ];

export const CORE_BLOCKS = [
	'core/audio',
	'core/columns',
	'core/group',
	'core/heading',
	'core/html',
	'core/image',
	'core/list',
	'core/paragraph',
	'core/row',
	'core/separator',
	'core/spacer',
	'core/stack',
	'core/subhead',
	'core/video',
];

const currentYear = new Date().getFullYear();

// WARNING: sync data with Contact_Form_Field::render_date_field in class-contact-form-field.php
export const DATE_FORMATS = [
	{
		value: 'mm/dd/yy',
		/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 12/31/2023). */
		label: __( 'MM/DD/YYYY', 'jetpack-forms' ),
		example: `12/31/${ currentYear }`,
	},
	{
		value: 'dd/mm/yy',
		/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 31/12/2023). */
		label: __( 'DD/MM/YYYY', 'jetpack-forms' ),
		example: `21/12/${ currentYear }`,
	},
	{
		value: 'yy-mm-dd',
		/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 2023-12-31). */
		label: __( 'YYYY-MM-DD', 'jetpack-forms' ),
		example: `${ currentYear }-12-31`,
	},
];

export const DATE_FORMAT_OPTIONS = DATE_FORMATS.map(
	( { value, label: optionLabel, example } ) => ( {
		label: `${ optionLabel } (${ example })`,
		value,
	} )
);

export const FORM_BLOCK_NAME = 'jetpack/contact-form';

// Input field block types that can be auto-required when they're the only field in a form
// These are blocks that collect user input and have a 'required' attribute
//
// To add a new input field type:
// 1. Add the block name (with 'jetpack/' prefix) to this array
// 2. Ensure the field block has a 'required' attribute in its settings
// 3. The field should be a user input field (not structural like labels or buttons)
//
// See: projects/packages/forms/src/blocks/contact-form/child-blocks.js for available field blocks
export const INPUT_FIELD_TYPES = [
	'jetpack/field-text',
	'jetpack/field-name',
	'jetpack/field-email',
	'jetpack/field-url',
	'jetpack/field-telephone',
	'jetpack/field-textarea',
	'jetpack/field-number',
	'jetpack/field-date',
	'jetpack/field-time',
	'jetpack/field-select',
	'jetpack/field-checkbox',
	'jetpack/field-radio',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-consent',
	'jetpack/field-file',
	'jetpack/field-rating',
	'jetpack/field-slider',
];

// Cached Set for O(1) lookup performance
const INPUT_FIELD_TYPES_SET = new Set( INPUT_FIELD_TYPES );

// Helper function to check if a block is an input field
export const isInputField = blockName => INPUT_FIELD_TYPES_SET.has( blockName );

export const FORM_STYLE = {
	ANIMATED: 'animated',
	BELOW: 'below',
	DEFAULT: 'default',
	OUTLINED: 'outlined',
};
