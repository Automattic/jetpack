import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock WordPress Interactivity API
const mockStore = jest.fn();
const mockGetContext = jest.fn();
const mockGetConfig = jest.fn();
const mockGetElement = jest.fn();
const mockWithSyncEvent = jest.fn( callback => callback );

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: mockStore,
	getContext: mockGetContext,
	getConfig: mockGetConfig,
	getElement: mockGetElement,
	withSyncEvent: mockWithSyncEvent,
} ) );

// Mock libphonenumber-js
const mockParsePhoneNumber = jest.fn();
const mockAsYouType = jest.fn();
await jest.unstable_mockModule( 'libphonenumber-js/min/es6', () => ( {
	__esModule: true,
	default: mockParsePhoneNumber,
	AsYouType: mockAsYouType,
} ) );

// Mock validate helper
const mockIsEmptyValue = jest.fn();
await jest.unstable_mockModule( '../../../../src/contact-form/js/validate-helper', () => ( {
	isEmptyValue: mockIsEmptyValue,
} ) );

// Mock countries list
await jest.unstable_mockModule( '../../../../src/blocks/field-telephone/country-list', () => ( {
	countries: [
		{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States' },
		{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom' },
		{ code: 'FR', value: '+33', flag: '🇫🇷', country: 'France' },
	],
} ) );

describe( 'Phone Field View', () => {
	let mockContext;
	let mockElement;
	let mockAsYouTypeInstance;
	let storeConfig;

	beforeEach( async () => {
		jest.clearAllMocks();

		// Create mock HTML structure
		document.body.innerHTML = `
			<div class="jetpack-field__input-phone-wrapper" data-wp-context='{"fieldId":"test-phone","defaultCountry":"US","showCountrySelector":true}'>
				<div class="jetpack-field__input-prefix">
					<div class="jetpack-custom-combobox">
						<button class="jetpack-combobox-trigger" type="button">
							<span class="jetpack-combobox-selected"></span>
						</button>
						<div class="jetpack-combobox-dropdown">
							<input class="jetpack-combobox-search" type="text" placeholder="Search countries…">
							<div class="jetpack-combobox-options">
								<div class="jetpack-combobox-option jetpack-combobox-option-selected">
									<span class="jetpack-combobox-option-icon">🇺🇸</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<input class="jetpack-field__input-element" type="tel" id="test-phone-number" name="test-phone-number">
			</div>
		`;

		// Setup mock context
		mockContext = {
			fieldId: 'test-phone',
			defaultCountry: 'US',
			showCountrySelector: true,
			phoneNumber: '',
			phoneCountryCode: 'US',
			fullPhoneNumber: '',
			countryPrefix: '+1',
			comboboxOpen: false,
			allCountries: [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: true },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom', selected: false },
				{ code: 'FR', value: '+33', flag: '🇫🇷', country: 'France', selected: false },
			],
			filteredCountries: [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: true },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom', selected: false },
				{ code: 'FR', value: '+33', flag: '🇫🇷', country: 'France', selected: false },
			],
			selectedCountry: { code: 'US', value: '+1', flag: '🇺🇸', country: 'United States' },
		};

		mockElement = {
			ref: document.querySelector( '.jetpack-field__input-element' ),
		};

		// Setup AsYouType mock
		mockAsYouTypeInstance = {
			reset: jest.fn(),
			input: jest.fn(),
			getCountry: jest.fn(),
			getNationalNumber: jest.fn(),
		};

		// Mock implementations
		mockGetContext.mockReturnValue( mockContext );
		mockGetElement.mockReturnValue( mockElement );
		mockGetConfig.mockReturnValue( {
			i18n: {
				countryNames: {
					US: 'United States',
					GB: 'United Kingdom',
					FR: 'France',
				},
			},
		} );
		mockAsYouType.mockImplementation( () => mockAsYouTypeInstance );

		// Capture store configuration
		mockStore.mockImplementation( ( namespace, config ) => {
			storeConfig = config;
			return { actions: config.actions, callbacks: config.callbacks };
		} );

		// Import the module to initialize the store
		await import( '../../../../src/modules/field-phone/view.js' );
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'Phone validation', () => {
		test( 'validates required empty field', () => {
			mockIsEmptyValue.mockReturnValue( true );
			mockContext.phoneNumber = '';

			const result = storeConfig.state.validators.phone( '', true );

			expect( result ).toBe( 'is_required' );
			expect( mockIsEmptyValue ).toHaveBeenCalledWith( '' );
		} );

		test( 'allows empty optional field', () => {
			mockIsEmptyValue.mockReturnValue( true );
			mockContext.phoneNumber = '';

			const result = storeConfig.state.validators.phone( '', false );

			expect( result ).toBe( 'yes' );
		} );

		test( 'validates international phone number with country selector', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = true;
			mockContext.phoneNumber = '555-123-4567';
			mockContext.fullPhoneNumber = '+1 (555) 123-4567';

			const mockPhoneNumber = {
				isValid: () => true,
			};
			mockParsePhoneNumber.mockReturnValue( mockPhoneNumber );

			const result = storeConfig.state.validators.phone( 'unused', true );

			expect( result ).toBe( 'yes' );
			expect( mockParsePhoneNumber ).toHaveBeenCalledWith( '+1 (555) 123-4567' );
		} );

		test( 'invalidates malformed international phone number', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = true;
			mockContext.phoneNumber = 'invalid';
			mockContext.fullPhoneNumber = '+1 invalid';

			const mockPhoneNumber = {
				isValid: () => false,
			};
			mockParsePhoneNumber.mockReturnValue( mockPhoneNumber );

			const result = storeConfig.state.validators.phone( 'unused', true );

			expect( result ).toBe( 'invalid_phone' );
		} );

		test( 'validates phone number with regex fallback', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = false;
			mockContext.phoneNumber = '555-123-4567';
			mockContext.fullPhoneNumber = '555-123-4567';

			const result = storeConfig.state.validators.phone( '555-123-4567', true );

			expect( result ).toBe( 'yes' );
		} );

		test( 'invalidates phone number with invalid characters', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = false;
			mockContext.phoneNumber = '555-abc-4567';
			mockContext.fullPhoneNumber = '555-abc-4567';

			const result = storeConfig.state.validators.phone( '555-abc-4567', true );

			expect( result ).toBe( 'invalid_phone' );
		} );

		test( 'handles phone number starting with +', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = false;
			mockContext.fullPhoneNumber = '+1 555-123-4567';

			const mockPhoneNumber = {
				isValid: () => true,
			};
			mockParsePhoneNumber.mockReturnValue( mockPhoneNumber );

			const result = storeConfig.state.validators.phone( 'unused', true );

			expect( result ).toBe( 'yes' );
		} );

		test( 'handles phone number starting with 00', () => {
			mockIsEmptyValue.mockReturnValue( false );
			mockContext.showCountrySelector = false;
			mockContext.fullPhoneNumber = '001 555-123-4567';

			const mockPhoneNumber = {
				isValid: () => true,
			};
			mockParsePhoneNumber.mockReturnValue( mockPhoneNumber );

			const result = storeConfig.state.validators.phone( 'unused', true );

			expect( result ).toBe( 'yes' );
		} );
	} );

	describe( 'Phone input handler', () => {
		test( 'handles input without country selector', () => {
			mockContext.showCountrySelector = false;
			const mockEvent = {
				target: { value: '555-123-4567' },
			};

			storeConfig.actions.phoneNumberInputHandler( mockEvent );

			expect( mockContext.phoneNumber ).toBe( '555-123-4567' );
			expect( mockContext.fullPhoneNumber ).toBe( '555-123-4567' );
		} );

		test( 'self-heals initialization when called with country selector enabled', () => {
			mockContext.showCountrySelector = true;
			mockContext.fieldId = 'test-phone';

			const mockEvent = {
				target: { value: '555-123-4567' },
			};

			// Mock actions.updateField
			const mockUpdateField = jest.fn();
			storeConfig.actions.updateField = mockUpdateField;

			// With ensureInitialized, the handler should self-heal by querying
			// the DOM for refs and initializing, rather than throwing.
			storeConfig.actions.phoneNumberInputHandler( mockEvent );

			expect( mockAsYouType ).toHaveBeenCalledWith( 'US' );
			expect( mockUpdateField ).toHaveBeenCalledWith( 'test-phone', '555-123-4567' );
		} );
	} );

	describe( 'Country selection', () => {
		test( 'changes selected country', () => {
			mockContext.filtered = { code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom' };
			mockContext.allCountries = [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: true },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom', selected: false },
			];
			mockContext.filteredCountries = [ ...mockContext.allCountries ];

			storeConfig.actions.phoneCountryChangeHandler();

			expect( mockContext.selectedCountry.code ).toBe( 'GB' );
			expect( mockContext.phoneCountryCode ).toBe( 'GB' );
			expect( mockContext.countryPrefix ).toBe( '+44' );
			expect( mockContext.comboboxOpen ).toBe( false );
		} );

		test( 'filtering logic works correctly', () => {
			// Test the filtering logic independently
			const allCountries = [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States' },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom' },
				{ code: 'FR', value: '+33', flag: '🇫🇷', country: 'France' },
			];

			const searchTerm = 'united';
			const filtered = allCountries.filter(
				country =>
					country.country.toLowerCase().includes( searchTerm ) ||
					country.code.toLowerCase().includes( searchTerm ) ||
					country.value.includes( searchTerm )
			);

			expect( filtered ).toEqual( [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States' },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom' },
			] );
		} );
	} );

	describe( 'Keyboard navigation', () => {
		test( 'handles Escape key', () => {
			mockContext.comboboxOpen = true;

			const mockEvent = {
				key: 'Escape',
			};

			storeConfig.actions.phoneComboboxKeydownHandler( mockEvent );

			expect( mockContext.comboboxOpen ).toBe( false );
		} );

		test( 'handles Enter key with filtered countries', () => {
			mockContext.filteredCountries = [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: true },
			];
			mockContext.comboboxOpen = true;

			const mockEvent = {
				key: 'Enter',
				preventDefault: jest.fn(),
			};

			storeConfig.actions.phoneComboboxKeydownHandler( mockEvent );

			expect( mockEvent.preventDefault ).toHaveBeenCalled();
			expect( mockContext.selectedCountry.code ).toBe( 'US' );
			expect( mockContext.comboboxOpen ).toBe( false );
		} );

		test( 'handles ArrowDown key navigation', () => {
			mockContext.filteredCountries = [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: true },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom', selected: false },
			];

			const mockEvent = {
				key: 'ArrowDown',
				preventDefault: jest.fn(),
			};

			storeConfig.actions.phoneComboboxKeydownHandler( mockEvent );

			expect( mockEvent.preventDefault ).toHaveBeenCalled();
			expect( mockContext.selectedCountry.code ).toBe( 'GB' );
		} );

		test( 'handles ArrowUp key navigation', () => {
			mockContext.filteredCountries = [
				{ code: 'US', value: '+1', flag: '🇺🇸', country: 'United States', selected: false },
				{ code: 'GB', value: '+44', flag: '🇬🇧', country: 'United Kingdom', selected: true },
			];

			const mockEvent = {
				key: 'ArrowUp',
				preventDefault: jest.fn(),
			};

			storeConfig.actions.phoneComboboxKeydownHandler( mockEvent );

			expect( mockEvent.preventDefault ).toHaveBeenCalled();
			expect( mockContext.selectedCountry.code ).toBe( 'US' );
		} );
	} );

	describe( 'Callbacks', () => {
		describe( 'Flag text updates', () => {
			test( 'updateSelectedFlag sets flag by modifying existing text node data', () => {
				// Create element with existing text node
				const flagElement = document.createElement( 'span' );
				flagElement.textContent = '\u200B'; // Zero-width space placeholder
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.selectedCountry = { flag: '🇬🇧' };

				storeConfig.callbacks.updateSelectedFlag();

				// Should modify existing text node's data, not replace textContent
				expect( flagElement.firstChild.nodeType ).toBe( 3 ); // TEXT_NODE
				expect( flagElement.firstChild.data ).toBe( '🇬🇧' );
			} );

			test( 'updateSelectedFlag uses textContent when no text node exists', () => {
				// Create element without children
				const flagElement = document.createElement( 'span' );
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.selectedCountry = { flag: '🇫🇷' };

				storeConfig.callbacks.updateSelectedFlag();

				expect( flagElement ).toHaveTextContent( '🇫🇷' );
			} );

			test( 'updateSelectedFlag handles missing flag gracefully', () => {
				const flagElement = document.createElement( 'span' );
				flagElement.textContent = '🇺🇸';
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.selectedCountry = {};

				storeConfig.callbacks.updateSelectedFlag();

				expect( flagElement.firstChild.data ).toBe( '' );
			} );

			test( 'updateOptionFlag sets flag by modifying existing text node data', () => {
				const flagElement = document.createElement( 'span' );
				flagElement.textContent = '\u200B';
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.filtered = { flag: '🇩🇪' };

				storeConfig.callbacks.updateOptionFlag();

				expect( flagElement.firstChild.nodeType ).toBe( 3 );
				expect( flagElement.firstChild.data ).toBe( '🇩🇪' );
			} );

			test( 'updateOptionFlag uses textContent when no text node exists', () => {
				const flagElement = document.createElement( 'span' );
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.filtered = { flag: '🇯🇵' };

				storeConfig.callbacks.updateOptionFlag();

				expect( flagElement ).toHaveTextContent( '🇯🇵' );
			} );

			test( 'updateOptionFlag handles missing flag gracefully', () => {
				const flagElement = document.createElement( 'span' );
				flagElement.textContent = '🇺🇸';
				mockGetElement.mockReturnValue( { ref: flagElement } );
				mockContext.filtered = {};

				storeConfig.callbacks.updateOptionFlag();

				expect( flagElement.firstChild.data ).toBe( '' );
			} );
		} );

		test( 'registers phone input element', () => {
			const mockInputElement = document.querySelector( '.jetpack-field__input-element' );
			mockGetElement.mockReturnValue( { ref: mockInputElement } );

			storeConfig.callbacks.registerPhoneInput();

			expect( mockGetElement ).toHaveBeenCalled();
		} );

		test( 'registers combobox search input element', () => {
			const mockSearchElement = document.querySelector( '.jetpack-combobox-search' );
			mockGetElement.mockReturnValue( { ref: mockSearchElement } );

			storeConfig.callbacks.registerPhoneComboboxSearchInput();

			expect( mockGetElement ).toHaveBeenCalled();
		} );

		test( 'registers combobox options list element', () => {
			const mockOptionsElement = document.querySelector( '.jetpack-combobox-options' );
			mockGetElement.mockReturnValue( { ref: mockOptionsElement } );

			storeConfig.callbacks.registerPhoneComboboxOptionsList();

			expect( mockGetElement ).toHaveBeenCalled();
		} );

		test( 'initializes phone field without country selector', () => {
			mockContext.showCountrySelector = false;

			storeConfig.callbacks.initializePhoneFieldCustomComboBox();

			// Should return early without doing initialization
			expect( mockGetConfig ).not.toHaveBeenCalled();
		} );

		test( 'initializes phone field with country selector via DOM query', () => {
			mockContext.showCountrySelector = true;
			mockContext.fieldId = 'init-test-phone';

			// Point getElement to the tel input inside the DOM structure
			const phoneInput = document.querySelector( '.jetpack-field__input-element' );
			mockGetElement.mockReturnValue( { ref: phoneInput } );

			storeConfig.callbacks.initializePhoneFieldCustomComboBox();

			expect( mockGetConfig ).toHaveBeenCalledWith( 'jetpack/field-phone' );
			expect( mockAsYouType ).toHaveBeenCalledWith( 'US' );
			expect( mockContext.allCountries ).toHaveLength( 3 );
			expect( mockContext.selectedCountry.code ).toBe( 'US' );
		} );

		test( 'skips initialization if wrapper is not found', () => {
			mockContext.showCountrySelector = true;
			mockContext.fieldId = 'orphan-field';

			// Element not inside the expected wrapper
			const orphanElement = document.createElement( 'input' );
			document.body.appendChild( orphanElement );
			mockGetElement.mockReturnValue( { ref: orphanElement } );

			storeConfig.callbacks.initializePhoneFieldCustomComboBox();

			expect( mockGetConfig ).not.toHaveBeenCalled();
			expect( mockAsYouType ).not.toHaveBeenCalled();
		} );

		test( 'does not re-initialize if already initialized', () => {
			mockContext.showCountrySelector = true;
			mockContext.fieldId = 'reinit-test-phone';

			const phoneInput = document.querySelector( '.jetpack-field__input-element' );
			mockGetElement.mockReturnValue( { ref: phoneInput } );

			// First initialization
			storeConfig.callbacks.initializePhoneFieldCustomComboBox();
			expect( mockAsYouType ).toHaveBeenCalledTimes( 1 );

			// Second call should be a no-op (fast path)
			mockGetConfig.mockClear();
			storeConfig.callbacks.initializePhoneFieldCustomComboBox();
			expect( mockGetConfig ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Phone reset handler', () => {
		test( 'resets phone field to default values', () => {
			mockContext.phoneCountryCode = 'GB';
			mockContext.phoneNumber = '555-123-4567';
			mockContext.defaultCountry = 'US';

			storeConfig.actions.phoneResetHandler();

			expect( mockContext.phoneCountryCode ).toBe( 'US' );
			expect( mockContext.phoneNumber ).toBe( '' );
		} );
	} );

	describe( 'Phone focus handler', () => {
		test( 'closes combobox on phone input focus', () => {
			mockContext.comboboxOpen = true;

			storeConfig.actions.phoneNumberFocusHandler();

			expect( mockContext.comboboxOpen ).toBe( false );
		} );
	} );

	describe( 'Document click handler', () => {
		test( 'closes combobox when clicking outside', () => {
			mockContext.comboboxOpen = true;

			const outsideElement = document.createElement( 'div' );
			document.body.appendChild( outsideElement );

			const mockEvent = {
				target: outsideElement,
			};

			// Mock element.contains to return false
			jest.spyOn( mockElement.ref, 'contains' ).mockImplementation( () => false );

			storeConfig.actions.phoneComboboxDocumentClickHandler( mockEvent );

			expect( mockContext.comboboxOpen ).toBe( false );
		} );

		test( 'keeps combobox open when clicking inside', () => {
			mockContext.comboboxOpen = true;

			const mockEvent = {
				target: mockElement.ref,
			};

			// Mock element.contains to return true
			jest.spyOn( mockElement.ref, 'contains' ).mockImplementation( () => true );

			storeConfig.actions.phoneComboboxDocumentClickHandler( mockEvent );

			expect( mockContext.comboboxOpen ).toBe( true );
		} );
	} );
} );
