import { getContext, store, getConfig, withSyncEvent } from '@wordpress/interactivity';
import { validateField } from '../../contact-form/js/validate-helper';

const NAMESPACE = 'jetpack/form';

const updateField = ( fieldId, value, showFieldError = false ) => {
	const context = getContext();
	const field = context.fields[ fieldId ];
	const { type, isRequired, extra } = field;
	if ( field ) {
		field.value = value;
		field.error = validateField( type, value, isRequired, extra );
		field.showFieldError = showFieldError;
	}
};

const registerField = (
	fieldId,
	type,
	label = '',
	value = '',
	isRequired = false,
	extra = null
) => {
	const context = getContext();

	if ( ! context.fields[ fieldId ] ) {
		context.fields[ fieldId ] = {
			id: fieldId,
			type,
			label,
			value,
			isRequired,
			extra,
			error: validateField( type, value, isRequired, extra ),
			step: context?.step ? context.step : 1,
		};
	}
};
const config = getConfig( NAMESPACE );

const getError = field => {
	if ( field.type === 'number' ) {
		if ( field.error === 'invalid_min_number' ) {
			return config.error_types.invalid_min_number.replace( '%d', field.extra.min );
		}

		if ( field.error === 'invalid_max_number' ) {
			return config.error_types.invalid_max_number.replace( '%d', field.extra.max );
		}
	}

	return config.error_types && config.error_types[ field.error ];
};

const { state } = store( NAMESPACE, {
	state: {
		get fieldHasErrors() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ] || {};

			// Don't show is_required untill the user first tries to submit the form.
			if ( ! context.showErrors && field.error && field.error === 'is_required' ) {
				return false;
			}

			return ( context.showErrors || field.showFieldError ) && field.error && field.error !== 'yes';
		},

		get isEmptyForm() {
			const context = getContext();
			return ! Object.values( context.fields ).some( field => field.value !== '' );
		},

		get isSubmitting() {
			const context = getContext();
			return context.isSubmitting;
		},

		get isAriaDisabled() {
			const context = getContext();
			return context.isSubmitting;
		},

		get errorMessage() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ] || {};

			if ( ! ( context.showErrors || field.showFieldError ) || ! field.error ) {
				return '';
			}

			return getError( field );
		},

		get isFormValid() {
			if ( state.isEmptyForm ) {
				return false;
			}
			const context = getContext();
			return ! Object.values( context.fields ).some( field => field.error !== 'yes' );
		},

		get showFromErrors() {
			const context = getContext();

			return ! state.isFormValid && context.showErrors;
		},

		get getFormErrorMessage() {
			if ( state.isEmptyForm ) {
				return config.error_types.invalid_form_empty;
			}
			return config.error_types.invalid_form;
		},

		get getErrorList() {
			const errors = [];
			if ( state.isEmptyForm ) {
				return errors;
			}
			const context = getContext();
			if ( context.showErrors ) {
				Object.values( context.fields ).forEach( field => {
					if ( field.error && field.error !== 'yes' ) {
						errors.push( {
							anchor: '#' + field.id,
							label: field.label + ' : ' + getError( field ),
							id: field.id,
						} );
					}
				} );
			}
			return errors;
		},

		get getFieldValue() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ];
			return field.value;
		},
	},

	actions: {
		updateFieldValue: ( fieldId, value ) => {
			updateField( fieldId, value );
		},

		onFieldChange: withSyncEvent( event => {
			let value = event.target.value;
			const context = getContext();
			const fieldId = context.fieldId;

			if ( context.fieldType === 'checkbox' ) {
				value = event.target.checked ? '1' : '';
			}

			updateField( fieldId, value );
		} ),
		// prevents the defalut action from adding
		handleNumberKeyPress: withSyncEvent( event => {
			// Allow only numbers, decimal point and minus sign.
			if ( ! /^[0-9.]*$/.test( event.key ) ) {
				event.preventDefault();
			}
			// check if it has multiple decimal points
			if ( event.key === '.' && event.target.value.includes( '.' ) ) {
				event.preventDefault();
			}
		} ),

		handleOnInputField: withSyncEvent( event => {
			const value = event.target.value;
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ];

			if ( field.type === 'checkbox' ) {
				field.value = event.target.checked ? value : '';
			} else {
				field.value = value;
			}

			field.error = validateField( field.type, field.value, field.isRequired, field.extra );
		} ),

		onMultipleFieldChange: withSyncEvent( event => {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ];
			const value = event.target.value;
			let newValues = [ ...( field.value || [] ) ];

			if ( event.target.checked ) {
				newValues.push( value );
			} else {
				newValues = newValues.filter( v => v !== value );
			}

			updateField( fieldId, newValues );
		} ),

		handleBlurField: withSyncEvent( event => {
			const context = getContext();
			updateField( context.fieldId, event.target.value, true );
		} ),

		formSubmit: withSyncEvent( event => {
			const context = getContext();

			if ( ! state.isFormValid ) {
				context.showErrors = true;
				event.preventDefault();
				event.stopPropagation();
			} else {
				context.isSubmitting = true;
			}
		} ),
	},

	callbacks: {
		initializeField() {
			const context = getContext();
			const { fieldId, fieldType, fieldLabel, fieldValue, fieldIsRequired, fieldExtra } = context;
			registerField( fieldId, fieldType, fieldLabel, fieldValue, fieldIsRequired, fieldExtra );
		},
	},
} );
