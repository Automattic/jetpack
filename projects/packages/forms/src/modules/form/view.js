import { getContext, store, getConfig } from '@wordpress/interactivity';
import { validateField } from '../../contact-form/js/validate-helper';

const NAMESPACE = 'jetpack/forms';

const updateField = ( fieldId, value ) => {
	const context = getContext();
	const field = context.fields[ fieldId ];
	const { type, isRequired, extra } = field;
	if ( field ) {
		field.value = value;
		field.error = validateField( type, value, isRequired, extra );
	}
};

const registerField = ( fieldId, type, value = '', isRequired = false, extra = null ) => {
	const context = getContext();
	if ( ! context.fields[ fieldId ] ) {
		context.fields[ fieldId ] = {
			type,
			value,
			isRequired,
			extra,
			error: validateField( type, value, isRequired, extra ),
		};
	}
};

const { state } = store( NAMESPACE, {
	state: {
		get hasErrors() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ] || {};

			return context.showErrors && field.error && field.error !== 'yes';
		},

		get errorMessage() {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ] || {};

			if ( ! context.showErrors || ! field.error ) {
				return '';
			}

			const config = getConfig( NAMESPACE );
			return config.error_types && config.error_types[ field.error ];
		},

		get isFormValid() {
			const context = getContext();
			return ! Object.values( context.fields ).some( field => field.error !== 'yes' );
		},
	},

	actions: {
		handleChangeField( event ) {
			const context = getContext();
			const fieldId = context.fieldId;
			let value = event.target.value;

			if ( context.fieldType === 'checkbox' ) {
				value = event.target.checked ? '1' : '';
			}

			updateField( fieldId, value );
		},

		handleOnInputField( event ) {
			const context = getContext();
			const fieldId = context.fieldId;
			const field = context.fields[ fieldId ];
			const value = event.target.value;

			if ( field.type === 'checkbox' ) {
				field.value = event.target.checked ? value : '';
			} else {
				field.value = value;
			}

			field.error = validateField( field.type, field.value, field.isRequired, field.extra );
		},

		handleMultipleChangeField( event ) {
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

		handleBlurField( event ) {
			const context = getContext();
			updateField( context.fieldId, event.target.value );
		},

		formSubmit( event ) {
			const context = getContext();
			context.showErrors = true;
			if ( ! state.isFormValid ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
	},

	callbacks: {
		initializeField() {
			const context = getContext();
			const { fieldId, fieldType, fieldValue, fieldIsRequired, fieldExtra } = context;
			registerField( fieldId, fieldType, fieldValue, fieldIsRequired, fieldExtra );
		},
	},
} );
