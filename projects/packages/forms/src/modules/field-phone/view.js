import { store, getContext, getConfig, getElement, withSyncEvent } from '@wordpress/interactivity';
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js';
import { countries } from '../../blocks/field-telephone/country-list';
import { isEmptyValue } from '../../contact-form/js/validate-helper';
const NAMESPACE = 'jetpack/form';

const asYouTypes = {};
const phoneInputRefs = {};
const searchInputRefs = {};
const optionsListRefs = {};
const updateSelection = selectedCountry => {
	const context = getContext();
	context.phoneCountryCode = selectedCountry.code;
	context.countryPrefix = selectedCountry.value;
	context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
	asYouTypes[ context.fieldId ] = new AsYouType( context.phoneCountryCode );
	context.filteredCountries = context.filteredCountries.map( country => ( {
		...country,
		selected: country.code === selectedCountry.code,
	} ) );
	context.allCountries = context.allCountries.map( country => ( {
		...country,
		selected: country.code === selectedCountry.code,
	} ) );
};

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
				context.countryPrefix = countries.find(
					item => item.code === context.phoneCountryCode
				)?.value;
			} else {
				context.phoneNumber = value;
			}
			context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
			actions.updateField( fieldId, value );
		},
		onPhoneCountryChange( event ) {
			const context = getContext();
			context.phoneCountryCode = event?.target?.value || context.defaultCountry;
			context.countryPrefix = countries.find(
				item => item.code === context.phoneCountryCode
			)?.value;
			asYouTypes[ context.fieldId ] = new AsYouType( context.phoneCountryCode );
			context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
		},
		phoneNumberInputHandler( event ) {
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
				const countryCode = asYouTypes[ fieldId ].getCountry();
				context.phoneNumber = asYouTypes[ fieldId ].getNationalNumber();
				context.selectedCountry = context.allCountries.find(
					country => country.code === countryCode
				);
				updateSelection( context.selectedCountry );
			} else {
				context.phoneNumber = value;
			}

			actions.updateField( fieldId, value );
		},
		phoneCountryChangeHandler() {
			const context = getContext();
			// this context.filtered is from the template iterator
			context.selectedCountry = { ...context.filtered };
			updateSelection( context.selectedCountry );
			context.comboboxOpen = false;
			phoneInputRefs[ context.fieldId ]?.focus?.();
		},
		phoneComboboxInputHandler( event ) {
			const context = getContext();
			const searchTerm = event.target.value;
			context.filteredCountries = context.allCountries.filter(
				country =>
					country.country.toLowerCase().includes( searchTerm ) ||
					country.code.toLowerCase().includes( searchTerm ) ||
					country.value.includes( searchTerm )
			);
			optionsListRefs[ context.fieldId ]
				.querySelector( '.jetpack-combobox-option-selected' )
				?.scrollIntoView?.( { block: 'nearest', container: 'nearest', behavior: 'instant' } );
		},
		phoneComboboxKeydownHandler: withSyncEvent( event => {
			const context = getContext();
			if ( event.key === 'Escape' ) {
				context.comboboxOpen = false;
			} else if ( event.key === 'Enter' ) {
				event.preventDefault();
				// Select the first filtered option if available
				if ( event.target.value && context.filteredCountries.length > 0 ) {
					context.selectedCountry = context.filteredCountries[ 0 ];
					updateSelection( context.selectedCountry );
					context.comboboxOpen = false;
					// Focus on the ref input
					phoneInputRefs[ context.fieldId ]?.focus?.();
				}
			}
		} ),
		phoneNumberFocusHandler() {
			const context = getContext();
			context.comboboxOpen = false;
		},
		phoneComboboxToggle() {
			const context = getContext();
			context.comboboxOpen = ! context.comboboxOpen;
			if ( context.comboboxOpen ) {
				setTimeout( () => {
					searchInputRefs[ context.fieldId ]?.focus?.();
					optionsListRefs[ context.fieldId ]
						.querySelector( '.jetpack-combobox-option-selected' )
						?.scrollIntoView?.( { block: 'nearest', container: 'nearest' } );
				}, 0 );
			}
		},
	},
	callbacks: {
		initializePhoneField() {
			const element = getElement().ref;
			const context = getContext();
			// store refs for quick access later and less intensive dom scouting
			phoneInputRefs[ context.fieldId ] = element.querySelector( 'input[type="tel"]' );
			searchInputRefs[ context.fieldId ] = element.parentElement.querySelector(
				'.jetpack-combobox-search'
			);
			optionsListRefs[ context.fieldId ] = element.parentElement.querySelector(
				'.jetpack-combobox-options'
			);
		},
		initializeCustomComboBox() {
			const context = getContext();
			if ( ! context.showCountrySelector ) {
				return;
			}
			const config = getConfig( 'jetpack/field-phone' );
			context.allCountries = countries.map( country => ( {
				...country,
				country: config?.i18n?.countryNames?.[ country.code ] || '',
				selected: country.code === context.defaultCountry,
			} ) );
			context.filteredCountries = [ ...context.allCountries ];
			context.selectedCountry = context.filteredCountries.find(
				country => country.code === context.defaultCountry
			);
			asYouTypes[ context.fieldId ] = new AsYouType( context.defaultCountry );
		},
	},
} );
