import { SelectControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useFormStyle, useFormWrapper } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const currentYear = new Date().getFullYear();

// WARNING: sync data with Contact_Form_Field::render_date_field in class-contact-form-field.php
const DATE_FORMATS = [
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

const JetpackDatePicker = props => {
	const { attributes, clientId, isSelected, name, setAttributes } = props;
	const { id, label, required, requiredText, width, placeholder, dateFormat } = attributes;

	useFormWrapper( { attributes, clientId, name } );

	const { blockStyle, fieldStyle } = useJetpackFieldStyles( attributes );
	const formStyle = useFormStyle( clientId );

	const classes = clsx( 'jetpack-field', {
		'is-selected': isSelected,
		'has-placeholder': !! placeholder,
	} );

	return (
		<>
			<div className={ classes } style={ blockStyle }>
				<JetpackFieldLabel
					attributes={ attributes }
					label={ label }
					suffix={ `(${ DATE_FORMATS.find( f => f.value === dateFormat )?.label })` }
					required={ required }
					requiredText={ requiredText }
					setAttributes={ setAttributes }
					style={ formStyle }
				/>
				<input
					className="jetpack-field__input"
					onChange={ e => setAttributes( { placeholder: e.target.value } ) }
					style={ fieldStyle }
					type="text"
					value={ placeholder }
				/>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				placeholder={ placeholder }
				attributes={ attributes }
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<SelectControl
								label={ __( 'Date Format', 'jetpack-forms' ) }
								options={ DATE_FORMATS.map( ( { value, label: optionLabel, example } ) => ( {
									value,
									label: `${ optionLabel } (${ example })`,
								} ) ) }
								onChange={ value =>
									setAttributes( {
										dateFormat: value,
									} )
								}
								value={ attributes.dateFormat }
								help={ __(
									'Select the format in which the date will be displayed.',
									'jetpack-forms'
								) }
							/>
						),
					},
				] }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackDatePicker );
