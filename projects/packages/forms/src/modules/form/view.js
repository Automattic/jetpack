/*
 * External dependencies
 */
import {
	getContext,
	store,
	getConfig,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
/*
 * Internal dependencies
 */
import { validateField } from '../../contact-form/js/validate-helper';
import { focusNextInput, dispatchSubmitEvent, submitForm } from './shared';

const withSyncEvent =
	originalWithSyncEvent ||
	( cb =>
		( ...args ) =>
			cb( ...args ) );

const NAMESPACE = 'jetpack/form';
const config = getConfig( NAMESPACE );

const updateField = ( fieldId, value, showFieldError = false ) => {
	const context = getContext();
	let field = context.fields[ fieldId ];

	if ( ! field ) {
		const { fieldType, fieldLabel, fieldValue, fieldIsRequired, fieldExtra } = context;
		registerField( fieldId, fieldType, fieldLabel, fieldValue, fieldIsRequired, fieldExtra );
		field = context.fields[ fieldId ];
	}
	if ( field ) {
		const { type, isRequired, extra } = field;
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

		get isFormEmpty() {
			const context = getContext();
			// If this is a multistep form (identified by the presence of `maxSteps` in context),
			// we never want to treat the form as completely empty. Treat it as not empty so that
			// the `invalid_form_empty` message is never shown for multistep forms.
			if ( context?.maxSteps && context.maxSteps > 0 ) {
				return false;
			}
			return ! Object.values( context.fields ).some( field => field.value !== '' );
		},

		get isFieldEmpty() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ] || {};
			return !! (
				field.value === '' ||
				( Array.isArray( field.value ) && field.value.length === 0 )
			);
		},

		get hasFieldValue() {
			return ! state.isFieldEmpty;
		},

		get isSubmitting() {
			const context = getContext();
			return context.isSubmitting;
		},

		get isAriaDisabled() {
			return state.isSubmitting;
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
			if ( state.isFormEmpty ) {
				return false;
			}
			const context = getContext();
			if ( context.isMultiStep ) {
				// For multistep forms, we only validate fields that are part of the current step.
				return ! Object.values( context.fields ).some(
					field => field.error !== 'yes' && field.step === context.currentStep
				);
			}
			return ! Object.values( context.fields ).some( field => field.error !== 'yes' );
		},

		get showFromErrors() {
			const context = getContext();

			return ! state.isFormValid && context.showErrors;
		},

		get getFormErrorMessage() {
			if ( state.isFormEmpty ) {
				const context = getContext();
				// Never show the "form empty" error for multistep forms.
				if ( context.isMultiStep ) {
					return config.error_types.invalid_form_empty;
				}
			}
			return config.error_types.invalid_form;
		},

		get getErrorList() {
			const errors = [];
			if ( state.isFormEmpty ) {
				return errors;
			}
			const context = getContext();
			if ( context.showErrors ) {
				Object.values( context.fields ).forEach( field => {
					if ( context.isMultiStep && field.step !== context.currentStep ) {
						return;
					}
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

		get submissionError() {
			const context = getContext();
			return context.submissionError || '';
		},
	},

	actions: {
		updateFieldValue: ( fieldId, value ) => {
			updateField( fieldId, value );
		},

		// prevents the number field value from being changed by non-numeric values
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

		onFieldChange: event => {
			let value = event.target.value;
			const context = getContext();
			const fieldId = context.fieldId;

			if ( context.fieldType === 'checkbox' ) {
				value = event.target.checked ? '1' : '';
			}

			updateField( fieldId, value );
		},

		onMultipleFieldChange: event => {
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
		},

		onFieldBlur: event => {
			const context = getContext();
			updateField( context.fieldId, event.target.value, true );
		},

		onFormSubmit: withSyncEvent( function* ( event ) {
			const context = getContext();

			if ( ! state.isFormValid ) {
				context.showErrors = true;
				event.preventDefault();
				event.stopPropagation();

				return;
			}

			if ( context.isMultiStep && context.currentStep < context.maxSteps ) {
				// If this is a multistep form and the current input is not the last in the step,
				// we don't want to submit the form, but rather advance to the next step.
				context.currentStep += 1;
				context.showErrors = false;

				event.preventDefault();
				event.stopPropagation();
				const formHash = context.formHash;

				setTimeout( () => {
					focusNextInput( formHash );
				}, 100 );

				return;
			}

			// Set submitting state
			context.isSubmitting = true;

			if ( context.isAjaxSubmissionEnabled ) {
				event.preventDefault();
				event.stopPropagation();

				// TODO: Get the data and update the page
				yield submitForm( context.formHash );

				context.isSubmitting = false;
			}
		} ),

		onKeyDownTextarea: withSyncEvent( event => {
			if ( ! ( event.key === 'Enter' && event.shiftKey ) ) {
				return;
			}
			// Prevent the default behavior of adding a new line.
			event.preventDefault();
			event.stopPropagation();

			const context = getContext();

			dispatchSubmitEvent( context.formHash );
		} ),

		scrollIntoView: withSyncEvent( event => {
			const context = getContext();

			const element = document.querySelector( context.item.anchor );

			if ( element ) {
				element.focus( { preventScroll: true } );
				element.scrollIntoView( { behavior: 'smooth' } );
				event.preventDefault();
				return;
			}
			const findName = context.item.anchor.substring( 1 );
			// If the anchor is a hash, we need to find the element with that ID.
			const anchorElement = document.querySelector( '[name="' + findName + '"]' );
			if ( anchorElement ) {
				anchorElement.focus( { preventScroll: true } );
				anchorElement.scrollIntoView( { behavior: 'smooth' } );
				event.preventDefault();
				return;
			}

			// If the element is not found, we can log an error or handle it as needed.
			const fieldset = document.getElementById( findName + '-label' );
			if ( fieldset ) {
				fieldset.querySelector( 'input' ).focus( { preventScroll: true } );
				fieldset.scrollIntoView( { behavior: 'smooth' } );
				event.preventDefault();
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
