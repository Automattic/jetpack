import { __ } from '@wordpress/i18n';

export const ALLOWED_FORMATS = [ 'core/bold', 'core/italic' ];
export const ALLOWED_INNER_BLOCKS = [ 'jetpack/label', 'jetpack/input' ];

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

export const FORM_STYLE = {
	ANIMATED: 'animated',
	BELOW: 'below',
	DEFAULT: 'default',
	OUTLINED: 'outlined',
};
