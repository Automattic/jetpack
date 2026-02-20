import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

// List of reserved HTML form element attribute names
const reservedAttributes = [
	'accept',
	'action',
	'autocomplete',
	'enctype',
	'method',
	'name',
	'novalidate',
	'target',
	'type',
	'value',
];

const JetpackFieldId = ( { id, setAttributes } ) => {
	const helpMessage = __(
		"Customize the input's name/ID. Only alphanumeric, dash and underscore characters are allowed",
		'jetpack-forms'
	);

	const [ errorState, setErrorState ] = useState( {
		error: false,
		message: '',
	} );

	const setId = value => {
		const newValue = value.replace( /[^a-zA-Z0-9_-]/g, '' );
		const reservedWordError = word => {
			return sprintf(
				/* translators: %s is the reserved attribute name causing an error */
				__( 'The name/ID "%s" is a reserved word. Please use a different name.', 'jetpack-forms' ),
				word
			);
		};

		// Only set ID if it's not a reserved attribute name (case insensitive)
		if ( ! reservedAttributes.some( attr => attr.toLowerCase() === newValue.toLowerCase() ) ) {
			setErrorState( {
				error: false,
				message: '',
			} );
			setAttributes( { id: newValue } );
		} else {
			setErrorState( {
				error: true,
				message: reservedWordError( newValue ),
			} );
		}
	};

	return (
		<InspectorAdvancedControls>
			<TextControl
				className={ errorState.error ? 'jetpack-forms-field-controls__input-error' : '' }
				label={ __( 'Name/ID', 'jetpack-forms' ) }
				value={ id || '' }
				onChange={ setId }
				help={ errorState.error ? errorState.message : helpMessage }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>
		</InspectorAdvancedControls>
	);
};

export default JetpackFieldId;
