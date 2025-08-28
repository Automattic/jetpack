import { store, getContext, getElement, withSyncEvent, withScope } from '@wordpress/interactivity';
import parsePhoneNumber, { AsYouType } from 'libphonenumber-js';
import { countries } from '../../blocks/field-telephone/country-list';
import { isEmptyValue } from '../../contact-form/js/validate-helper';
const NAMESPACE = 'jetpack/form';

const asYouTypes = {};

// const updateSelection = ( selectedDisplay, selectedCountry ) => {
// 	selectedDisplay.innerHTML = `
// 		<span>
// 			${ selectedCountry.flag } ${ selectedCountry.value }
// 		</span>
// 	`;
// 	const context = getContext();
// 	context.phoneCountryCode = selectedCountry.code;
// 	context.countryPrefix = selectedCountry.value;
// 	context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
// 	asYouTypes[ context.fieldId ] = new AsYouType( context.phoneCountryCode );
// };

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
				console.log( 'context.fullPhoneNumber', context.fullPhoneNumber );
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
			console.log( 'onPhoneCountryChange', event );
			const context = getContext();
			context.phoneCountryCode = event?.target?.value || context.defaultCountry;
			context.countryPrefix = countries.find(
				item => item.code === context.phoneCountryCode
			)?.value;
			asYouTypes[ context.fieldId ] = new AsYouType( context.phoneCountryCode );
			context.fullPhoneNumber = context.countryPrefix + ' ' + context.phoneNumber;
		},
		phoneComboboxToggle() {
			const context = getContext();
			context.comboboxOpen = ! context.comboboxOpen;
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
		initializeCustomComboBox() {
			const context = getContext();
			if ( ! context.showCountrySelector ) {
				return;
			}
			context.filteredCountries = countries.map( country => ( {
				...country,
				label: country.country + ' ' + country.flag + ' ' + country.value,
				value: country.code,
				selected: country.code === context.defaultCountry,
			} ) );
			context.selectedCountry = countries.find(
				country => country.code === context.defaultCountry
			);
			context.selectedCountryDisplay = `${ context.selectedCountry.flag } ${ context.selectedCountry.value }`;
			// // Find the parent element with class jetpack-field__input-prefix
			// const parentElement = getElement().ref;
			// if ( ! parentElement ) {
			// 	return;
			// }
			// // Find the native select element
			// const nativeSelect = parentElement.querySelector( 'select' );
			// if ( ! nativeSelect ) {
			// 	return;
			// }
			// // Create the custom combobox container
			// const comboBox = document.createElement( 'div' );
			// comboBox.className = 'jetpack-custom-combobox';
			// // Create the display button
			// const displayButton = document.createElement( 'button' );
			// displayButton.type = 'button';
			// displayButton.className = 'jetpack-combobox-trigger';
			// // Create the dropdown arrow
			// const arrow = document.createElement( 'span' );
			// arrow.innerHTML = '▼';
			// arrow.className = 'jetpack-combobox-trigger-arrow';
			// // Create the selected value display
			// const selectedDisplay = document.createElement( 'span' );
			// selectedDisplay.className = 'jetpack-combobox-selected';
			// displayButton.appendChild( selectedDisplay );
			// displayButton.appendChild( arrow );
			// // Create the dropdown container
			// const dropdown = document.createElement( 'div' );
			// dropdown.className = 'jetpack-combobox-dropdown';
			// // Create the search input
			// const searchInput = document.createElement( 'input' );
			// searchInput.type = 'text';
			// searchInput.placeholder = 'Search countries...';
			// searchInput.className = 'jetpack-combobox-search';
			// // Create the options list
			// const optionsList = document.createElement( 'div' );
			// optionsList.className = 'jetpack-combobox-options';
			// dropdown.appendChild( searchInput );
			// dropdown.appendChild( optionsList );
			// // Assemble the combobox
			// comboBox.appendChild( displayButton );
			// comboBox.appendChild( dropdown );
			// // State for the combobox
			// let isOpen = false;
			// let filteredCountries = [ ...countries ];
			// let selectedCountry =
			// 	countries.find( country => country.code === context.defaultCountry ) || countries[ 0 ];
			// // Function to render options
			// const renderOptions = ( countriesToRender = filteredCountries ) => {
			// 	optionsList.innerHTML = '';
			// 	countriesToRender.forEach( country => {
			// 		const option = document.createElement( 'div' );
			// 		option.className = `jetpack-combobox-option ${
			// 			country.code === selectedCountry.code ? 'jetpack-combobox-option-selected' : ''
			// 		}`;
			// 		option.innerHTML = `
			// 			<span class="jetpack-combobox-option-icon">${ country.flag }</span>
			// 			<span class="jetpack-combobox-option-value">${ country.value }</span>
			// 			<span class="jetpack-combobox-option-description">${ country.country }</span>
			// 		`;
			// 		option.addEventListener( 'mouseenter', () => {
			// 			option.style.backgroundColor = '#f5f5f5';
			// 		} );
			// 		option.addEventListener( 'mouseleave', () => {
			// 			option.style.backgroundColor =
			// 				country.code === selectedCountry.code ? '#f0f0f0' : 'transparent';
			// 		} );
			// 		option.addEventListener(
			// 			'click',
			// 			withScope( () => {
			// 				selectedCountry = country;
			// 				updateSelection( selectedDisplay, selectedCountry );
			// 				closeDropdown();
			// 			} )
			// 		);
			// 		optionsList.appendChild( option );
			// 	} );
			// };
			// // Function to open dropdown
			// const openDropdown = withScope( () => {
			// 	isOpen = true;
			// 	dropdown.style.display = 'block';
			// 	arrow.style.transform = 'rotate(180deg)';
			// 	searchInput.focus();
			// 	renderOptions();
			// } );
			// // Function to close dropdown
			// const closeDropdown = () => {
			// 	isOpen = false;
			// 	dropdown.style.display = 'none';
			// 	arrow.style.transform = 'rotate(0deg)';
			// 	searchInput.value = '';
			// 	filteredCountries = [ ...countries ];
			// };
			// // Function to filter countries based on search
			// const filterCountries = searchTerm => {
			// 	const term = searchTerm.toLowerCase();
			// 	filteredCountries = countries.filter(
			// 		country =>
			// 			country.country.toLowerCase().includes( term ) ||
			// 			country.code.toLowerCase().includes( term ) ||
			// 			country.value.includes( term )
			// 	);
			// 	renderOptions( filteredCountries );
			// };
			// // Event listeners
			// displayButton.addEventListener( 'click', e => {
			// 	e.preventDefault();
			// 	e.stopPropagation();
			// 	if ( isOpen ) {
			// 		closeDropdown();
			// 	} else {
			// 		openDropdown();
			// 	}
			// } );
			// searchInput.addEventListener(
			// 	'input',
			// 	withScope( e => {
			// 		filterCountries( e.target.value );
			// 	} )
			// );
			// searchInput.addEventListener(
			// 	'keydown',
			// 	withSyncEvent(
			// 		withScope( e => {
			// 			if ( e.key === 'Escape' ) {
			// 				closeDropdown();
			// 			} else if ( e.key === 'Enter' ) {
			// 				e.preventDefault();
			// 				// Select the first filtered option if available
			// 				if ( filteredCountries.length > 0 ) {
			// 					selectedCountry = filteredCountries[ 0 ];
			// 					updateSelection( selectedDisplay, selectedCountry );
			// 					closeDropdown();
			// 					// Focus on the next input (phone number input)
			// 					const phoneInput = parentElement.parentElement.querySelector( 'input[type="tel"]' );
			// 					if ( phoneInput ) {
			// 						phoneInput.focus();
			// 					}
			// 				}
			// 			}
			// 		} )
			// 	)
			// );
			// // Close dropdown when clicking outside
			// document.addEventListener( 'click', e => {
			// 	if ( ! comboBox.contains( e.target ) ) {
			// 		closeDropdown();
			// 	}
			// } );
			// // Initialize the display
			// updateSelection( selectedDisplay, selectedCountry );
			// // Hide the native select and replace with custom combobox
			// nativeSelect.style.display = 'none';
			// parentElement.appendChild( comboBox );
			// // Store reference for potential cleanup
			// nativeSelect.jetpackCustomComboBox = comboBox;
			// asYouTypes[ context.fieldId ] = new AsYouType( context.defaultCountry );
		},
	},
} );
