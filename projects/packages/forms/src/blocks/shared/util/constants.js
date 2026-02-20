import { __ } from '@wordpress/i18n';

export const ALLOWED_FORMATS = [ 'core/bold', 'core/italic' ];
export const ALLOWED_INNER_BLOCKS = [ 'jetpack/label', 'jetpack/input' ];

export const CORE_BLOCKS = [
	'core/accordion',
	'core/audio',
	'core/code',
	'core/columns',
	'core/details',
	'core/group',
	'core/heading',
	'core/html',
	'core/icon',
	'core/image',
	'core/list',
	'core/math',
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

/**
 * Vertical layout preset for new form variations and programmatic form creation
 * that should explicitly stack fields vertically.
 * Used by variations and createFormBlockStructure() to opt into vertical layout,
 * while older forms keep the legacy horizontal/wrap layout as their default.
 */
export const VERTICAL_LAYOUT = {
	type: 'flex',
	flexWrap: 'nowrap',
	orientation: 'vertical',
	justifyContent: 'left',
	verticalAlignment: 'top',
};

export const FORM_STYLE = {
	ANIMATED: 'animated',
	BELOW: 'below',
	DEFAULT: 'default',
	OUTLINED: 'outlined',
};

/**
 * The custom post type for jetpack forms.
 * Matches Contact_Form::POST_TYPE in PHP.
 */
export const FORM_POST_TYPE = 'jetpack_form';

/**
 * Meta key for tracking the source post ID.
 * Matches Contact_Form::SOURCE_META_KEY in PHP.
 */
export const FORM_SOURCE_META_KEY = '_jetpack_forms_source_post_id';
