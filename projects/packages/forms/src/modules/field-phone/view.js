import { store, getContext } from '@wordpress/interactivity';
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js';
import { countries } from '../../blocks/field-phone/country-list';
import { isEmptyValue } from '../../contact-form/js/validate-helper';
const NAMESPACE = 'jetpack/form';

const asYouTypes = {};

const { actions } = store( NAMESPACE, {
	state: {
		validators: {
			phone: ( value, isRequired ) => {
				const context = getContext();
				if ( isEmptyValue( context.phoneNumber ) && isRequired ) {
					// this is not triggering any error, but then no other input does either
					return 'is_required';
				}
				if ( ! isRequired && isEmptyValue( context.phoneNumber ) ) {
					// No need to validate anything.
					return 'yes';
				}

				// from this point on, we discard the value as we
				// use our internal full phone number state getter:
				value = context.fullPhoneNumber;
				if (
					context.showCountrySelector ||
					value.indexOf( '+' ) === 0 ||
					value.indexOf( '00' ) === 0
				) {
					const internationalNumber = parsePhoneNumber( value );
					if ( ! internationalNumber || ! internationalNumber.isValid() ) {
						return 'invalid_phone';
					}
				}

				// if no country selector or value starting with +, use legacy regex check
				if ( ! /^\+?[0-9\s\-()]+$/.test( value ) ) {
					return 'invalid_phone';
				}

				return 'yes';
			},
		},
	},
	actions: {
		phoneResetHandler() {
			const context = getContext();
			context.phoneCountryCode = context.defaultCountry;
			context.phoneNumber = '';
		},
		onPhoneNumberChange( event ) {
			const context = getContext();
			const fieldId = context.fieldId;
			const value = event.target.value;
			if ( ! context.showCountrySelector ) {
				context.phoneNumber = context.fullPhoneNumber = value;
				return;
			}
			const groomedValue = value.indexOf( '00' ) === 0 ? '+' + value.slice( 2 ) : value;

			asYouTypes[ fieldId ].reset();
			asYouTypes[ fieldId ].input( groomedValue );
			if ( asYouTypes[ fieldId ].getCountry() ) {
				context.phoneCountryCode = asYouTypes[ fieldId ].getCountry();
				context.phoneNumber = asYouTypes[ fieldId ].getNationalNumber();
				asYouTypes[ fieldId ] = new AsYouType( context.phoneCountryCode );
			} else {
				context.phoneNumber = value;
			}
			context.countryPrefix = countries.find(
				item => item.code === context.phoneCountryCode
			)?.value;
			context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
			actions.updateField( fieldId, value );
		},
		onPhoneCountryChange( event ) {
			const context = getContext();
			context.countryPrefix = countries.find( item => item.code === event?.target?.value )?.value;
			context.phoneCountryCode = event?.target?.value || context.defaultCountry;
			context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
		},
	},
	callbacks: {
		initializeCountrySelector() {
			const context = getContext();
			if ( context.showCountrySelector ) {
				context.countryList = countries.map( country => ( {
					...country,
					label: country.country + ' ' + country.flag + ' ' + country.value,
					value: country.code,
					selected: country.code === context.defaultCountry,
				} ) );
			}
			asYouTypes[ context.fieldId ] = new AsYouType( context.defaultCountry );
		},
	},
} );
