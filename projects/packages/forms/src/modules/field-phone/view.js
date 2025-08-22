import { store, getContext } from '@wordpress/interactivity';
import { countries } from '../../blocks/field-phone/country-list';
import { isEmptyValue } from '../../contact-form/js/validate-helper';
const NAMESPACE = 'jetpack/form';

const { state } = store( NAMESPACE, {
	state: {
		validators: {
			phone: ( value, isRequired ) => {
				if ( isEmptyValue( value ) && isRequired ) {
					return 'is_required';
				}

				if ( ! isRequired && isEmptyValue( value ) ) {
					// No need to validate anything.
					return 'yes';
				}

				if ( ! /^\+?[0-9\s\-()]+$/.test( value ) ) {
					return 'invalid_phone';
				}
				return 'yes';
			},
		},
		get fullPhoneNumber() {
			const context = getContext();
			if ( context.showCountrySelector ) {
				// if the user has typed the country code and didn't add a space,
				// assume they already typed a full international phone number
				if ( state.phoneNumber.indexOf( state.phoneCountryCode ) === 0 ) {
					return state.phoneNumber;
				}
				return `${ state.phoneCountryCode } ${ state.phoneNumber }`;
			}
			return state.phoneNumber;
		},
	},
	actions: {
		onReset() {
			const context = getContext();
			state.phoneCountryCode = context.defaultCountry;
			state.phoneNumber = '';
		},
		onPhoneNumberChange( event ) {
			const context = getContext();
			const value = event.target.value;

			if ( ! context.showCountrySelector ) {
				state.phoneNumber = value;
				return;
			}

			// Check for country code pattern: + followed by 1-3 digits
			const countryCodeMatch = value.match( /^\+(\d{1,4})/ );

			if ( countryCodeMatch ) {
				const potentialCode = countryCodeMatch[ 0 ];

				const countryItem = countries?.find( country => country.value === potentialCode );

				state.phoneCountryCode = countryItem?.value || context.phoneCountryCode;
				// If there's a space after the country code, split the input
				if ( value.charAt( potentialCode.length ) === ' ' ) {
					state.phoneNumber = value.substring( potentialCode.length + 1 );
				} else {
					// If no space yet, keep the whole input in phoneNumber
					state.phoneNumber = value;
				}
			} else {
				state.phoneNumber = value;
			}
		},
		onPhoneCountryChange( event ) {
			const context = getContext();
			state.phoneCountryCode = event?.target?.value || context.defaultCountry;
		},
	},
	callbacks: {
		initializeCountrySelector() {
			const context = getContext();
			if ( context.showCountrySelector ) {
				state.countryList = countries.map( country => ( {
					...country,
					selected: country.value === context.defaultCountry,
				} ) );
			}
		},
	},
} );
