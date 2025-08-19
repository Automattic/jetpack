import { store, getContext } from '@wordpress/interactivity';
import parsePhoneNumber from 'libphonenumber-js';
import { countries } from '../../blocks/field-phone/country-list';
import { isEmptyValue } from '../../contact-form/js/validate-helper';
const NAMESPACE = 'jetpack/form';

const { state, actions } = store( NAMESPACE, {
	state: {
		validators: {
			phone: ( value, isRequired ) => {
				if ( isEmptyValue( state.phoneNumber ) && isRequired ) {
					// this is not triggering any error, but then no other input does either
					return 'is_required';
				}
				if ( ! isRequired && isEmptyValue( state.phoneNumber ) ) {
					// No need to validate anything.
					return 'yes';
				}

				// from this point on, we discard the value as we
				// use our internal full phone number state getter:
				value = state.fullPhoneNumber;
				const context = getContext();
				if ( context.showCountrySelector ) {
					const internationalNumber = parsePhoneNumber( value );
					if ( ! internationalNumber || ! internationalNumber.isValid() ) {
						return 'invalid_phone';
					}
				}

				// if no country selector, use legacy regex check
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
			const fieldId = context.fieldId;
			if ( value.indexOf( '+' ) === 0 && value.length > 1 ) {
				// user is trying to type an international phone number
				const internationalNumber = parsePhoneNumber( value );
				if ( internationalNumber ) {
					const country = countries.find( item => item.code === internationalNumber.country );
					state.phoneCountryCode = country?.value || context.defaultCountry;
					state.phoneNumber = internationalNumber.nationalNumber;
				}
			} else {
				state.phoneNumber = value;
			}
			actions.updateField( fieldId, value );
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
