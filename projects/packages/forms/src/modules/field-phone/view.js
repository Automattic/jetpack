import {
	store,
	getContext,
	getConfig,
	getElement,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js';
import { countries } from '../../blocks/field-telephone/country-list.js';
import { isEmptyValue } from '../../contact-form/js/validate-helper.js';
const NAMESPACE = 'jetpack/form';

const withSyncEvent =
	originalWithSyncEvent ||
	( cb =>
		( ...args ) =>
			cb( ...args ) );

const asYouTypes = {};
const phoneInputRefs = {};
const searchInputRefs = {};
const optionsListRefs = {};

/**
 * Ensures the phone field is fully initialized. Serves as both the primary
 * initialization path (called from data-wp-init) and a safety net for event
 * handlers in case the init callback was missed — which can happen when the
 * module loads after DOMContentLoaded and the Interactivity API has already
 * processed the DOM.
 *
 * @param {string} fieldId - The field ID to initialize.
 * @return {boolean} Whether the field is initialized and ready.
 */
const ensureInitialized = fieldId => {
	if ( asYouTypes[ fieldId ] ) {
		return true;
	}

	const context = getContext();
	if ( ! context.showCountrySelector ) {
		return true;
	}

	// Resolve refs via DOM query if register callbacks haven't fired.
	const { ref } = getElement();
	const wrapper = ref.closest( '.jetpack-field__input-phone-wrapper' );
	if ( ! wrapper ) {
		return false;
	}

	if ( ! phoneInputRefs[ fieldId ] ) {
		phoneInputRefs[ fieldId ] = wrapper.querySelector( '.jetpack-field__input-element' );
	}
	if ( ! searchInputRefs[ fieldId ] ) {
		searchInputRefs[ fieldId ] = wrapper.querySelector( '.jetpack-combobox-search' );
	}
	if ( ! optionsListRefs[ fieldId ] ) {
		optionsListRefs[ fieldId ] = wrapper.querySelector( '.jetpack-combobox-options' );
	}

	if (
		! phoneInputRefs[ fieldId ] ||
		! searchInputRefs[ fieldId ] ||
		! optionsListRefs[ fieldId ]
	) {
		return false;
	}

	const config = getConfig( 'jetpack/field-phone' );
	context.allCountries = countries.map( country => ( {
		...country,
		country: config?.i18n?.countryNames?.[ country.code ] || country.country,
		selected: country.code === context.defaultCountry,
	} ) );
	context.filteredCountries = [ ...context.allCountries ];
	context.selectedCountry = context.filteredCountries.find(
		country => country.code === context.defaultCountry
	);
	asYouTypes[ fieldId ] = new AsYouType( context.defaultCountry );
	return true;
};

/**
 * Sets flag text on an element by modifying existing text node data instead of
 * replacing textContent. This avoids triggering wp-emoji's MutationObserver
 * (which only watches childList, not characterData) that converts emoji to SVG.
 *
 * @param {HTMLElement} element - The element to set flag text on.
 * @param {string}      flag    - The flag emoji to display.
 */
const setFlagText = ( element, flag ) => {
	const text = flag || '';
	if ( element.firstChild?.nodeType === 3 ) {
		element.firstChild.data = text;
	} else {
		element.textContent = text;
	}
};
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
		phoneNumberInputHandler( event ) {
			const context = getContext();
			const fieldId = context.fieldId;
			const value = event.target.value;
			if ( ! context.showCountrySelector ) {
				context.phoneNumber = context.fullPhoneNumber = value;
				return;
			}
			if ( ! ensureInitialized( fieldId ) ) {
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
			if ( ! ensureInitialized( context.fieldId ) ) {
				return;
			}
			// this context.filtered is from the template iterator
			context.selectedCountry = { ...context.filtered };
			updateSelection( context.selectedCountry );
			context.comboboxOpen = false;
			phoneInputRefs[ context.fieldId ]?.focus?.();
		},
		phoneComboboxInputHandler( event ) {
			const context = getContext();
			if ( ! ensureInitialized( context.fieldId ) ) {
				return;
			}
			const searchTerm = event.target.value.toLowerCase();
			context.filteredCountries = context.allCountries.filter(
				country =>
					country.country.toLowerCase().includes( searchTerm ) ||
					country.code.toLowerCase().includes( searchTerm ) ||
					country.value.includes( searchTerm )
			);
			optionsListRefs[ context.fieldId ].scrollTo?.( { top: 0, behavior: 'instant' } );
		},
		phoneComboboxKeydownHandler: withSyncEvent( event => {
			const context = getContext();
			if ( ! ensureInitialized( context.fieldId ) ) {
				return;
			}
			if ( event.key === 'Escape' ) {
				context.comboboxOpen = false;
			} else if ( event.key === 'Enter' ) {
				event.preventDefault();
				// Select either the currently selected country or the first filtered option if available
				if ( context.filteredCountries.length > 0 ) {
					const selectedCountry =
						context.filteredCountries.find( country => country.selected ) ||
						context.filteredCountries[ 0 ];
					context.selectedCountry = selectedCountry;
					updateSelection( context.selectedCountry );
					context.comboboxOpen = false;
					// Focus on the ref input
					phoneInputRefs[ context.fieldId ]?.focus?.();
				}
			} else if ( event.key === 'ArrowDown' ) {
				event.preventDefault();
				if ( context.filteredCountries.length > 0 ) {
					// Find index of currently selected country in filtered list
					const selectedIndex = context.filteredCountries.findIndex( country => country.selected );

					// If there's a next country in filtered list, select it, otherwise wrap to first
					const nextIndex =
						selectedIndex === context.filteredCountries.length - 1 ? 0 : selectedIndex + 1;
					context.selectedCountry = context.filteredCountries[ nextIndex ];
					updateSelection( context.selectedCountry );
					setTimeout( () => {
						// Find and scroll the newly selected option into view
						const selectedOption = optionsListRefs[ context.fieldId ].querySelector(
							'.jetpack-combobox-option-selected'
						);
						selectedOption?.scrollIntoView?.( {
							block: 'nearest',
							container: 'nearest',
							behavior: 'instant',
						} );
					}, 0 );
				}
			} else if ( event.key === 'ArrowUp' ) {
				event.preventDefault();
				if ( context.filteredCountries.length > 0 ) {
					// Find index of currently selected country in filtered list
					const selectedIndex = context.filteredCountries.findIndex( country => country.selected );

					// If there's a previous country in filtered list, select it, otherwise wrap to last
					const prevIndex =
						selectedIndex <= 0 ? context.filteredCountries.length - 1 : selectedIndex - 1;
					context.selectedCountry = context.filteredCountries[ prevIndex ];
					updateSelection( context.selectedCountry );
					setTimeout( () => {
						// Find and scroll the newly selected option into view
						const selectedOption = optionsListRefs[ context.fieldId ].querySelector(
							'.jetpack-combobox-option-selected'
						);
						selectedOption?.scrollIntoView?.( {
							block: 'nearest',
							container: 'nearest',
							behavior: 'instant',
						} );
					}, 0 );
				}
			}
		} ),
		phoneNumberFocusHandler() {
			const context = getContext();
			context.comboboxOpen = false;
		},
		phoneComboboxToggle() {
			const context = getContext();
			if ( ! ensureInitialized( context.fieldId ) ) {
				return;
			}
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
		phoneComboboxDocumentClickHandler( event ) {
			const { ref } = getElement();
			if ( ref.contains( event.target ) ) {
				return;
			}
			const context = getContext();
			context.comboboxOpen = false;
		},
	},
	callbacks: {
		/**
		 * Sets flag text by modifying existing text node data (nodeType 3 = TEXT_NODE)
		 * instead of replacing textContent, to avoid triggering wp-emoji's MutationObserver
		 * which only watches childList (not characterData) and converts emoji to SVG images.
		 */
		updateSelectedFlag() {
			const { ref } = getElement();
			const context = getContext();
			setFlagText( ref, context.selectedCountry?.flag );
		},
		updateOptionFlag() {
			const { ref } = getElement();
			const context = getContext();
			setFlagText( ref, context.filtered?.flag );
		},
		registerPhoneInput() {
			const element = getElement().ref;
			const context = getContext();
			phoneInputRefs[ context.fieldId ] = element;
		},
		registerPhoneComboboxSearchInput() {
			const element = getElement().ref;
			const context = getContext();
			searchInputRefs[ context.fieldId ] = element;
		},
		registerPhoneComboboxOptionsList() {
			const element = getElement().ref;
			const context = getContext();
			optionsListRefs[ context.fieldId ] = element;
		},
		initializePhoneFieldCustomComboBox() {
			const context = getContext();
			ensureInitialized( context.fieldId );
		},
	},
} );
