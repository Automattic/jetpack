import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

/**
 * CountryCombobox Component
 *
 * A reusable combobox component for selecting countries with search functionality.
 * Handles its own state management for open/closed state, filtering, and selection.
 *
 * @param {object}   props                     - The component props
 * @param {Array}    props.countries           - Array of country objects with code, country, flag, and value properties
 * @param {string}   props.selectedCountryCode - The currently selected country code
 * @param {Function} props.onCountryChange     - Callback function called when a country is selected
 * @param {boolean}  props.isOpen              - External control for combobox open state
 * @param {Function} props.onOpenChange        - Callback function for open state changes
 * @param {string}   props.className           - Additional CSS class names
 * @param {boolean}  props.disabled            - Whether the combobox is disabled
 * @return {Element|null} The CountryCombobox component or null if no countries/selectedCountry
 */
const CountryCombobox = ( {
	countries = [],
	selectedCountryCode = null,
	onCountryChange,
	isOpen: externalIsOpen = false,
	onOpenChange,
	className = '',
	disabled = false,
} ) => {
	const [ internalIsOpen, setInternalIsOpen ] = useState( false );
	const [ filteredCountries, setFilteredCountries ] = useState( [] );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ selectedCountry, setSelectedCountry ] = useState( null );
	const [ focusedOptionIndex, setFocusedOptionIndex ] = useState( -1 );
	const searchInputRef = useRef( null );
	const optionsRef = useRef( [] );

	// Use external open state if provided, otherwise use internal state
	const isOpen = onOpenChange ? externalIsOpen : internalIsOpen;
	const setIsOpen = onOpenChange || setInternalIsOpen;

	// Initialize filtered countries when countries change
	useEffect( () => {
		setFilteredCountries( countries );
	}, [ countries ] );

	// Update selected country when selectedCountryCode or countries change
	useEffect( () => {
		if ( ! selectedCountryCode || ! countries.length ) {
			setSelectedCountry( null );
			return;
		}

		const country = countries.find( option => option.code === selectedCountryCode );
		setSelectedCountry( country || null );
	}, [ selectedCountryCode, countries ] );

	// Filter countries based on search term
	useEffect( () => {
		if ( ! searchTerm ) {
			setFilteredCountries( countries );
			return;
		}

		const filtered = countries.filter(
			country =>
				country.country.toLowerCase().includes( searchTerm.toLowerCase() ) ||
				country.value.toLowerCase().includes( searchTerm.toLowerCase() ) ||
				country.code.toLowerCase().includes( searchTerm.toLowerCase() )
		);
		setFilteredCountries( filtered );
	}, [ searchTerm, countries ] );

	// Focus search input when combobox opens
	useEffect( () => {
		if ( isOpen && searchInputRef.current ) {
			setTimeout( () => {
				searchInputRef.current.focus();
			}, 0 );
		}
	}, [ isOpen ] );

	// Clear search term and reset focus when combobox closes
	useEffect( () => {
		if ( ! isOpen ) {
			setSearchTerm( '' );
			setFocusedOptionIndex( -1 );
		}
	}, [ isOpen ] );

	// Reset focused option when filtered countries change
	useEffect( () => {
		setFocusedOptionIndex( -1 );
	}, [ filteredCountries ] );

	// Scroll focused option into view
	useEffect( () => {
		if ( focusedOptionIndex >= 0 && optionsRef.current[ focusedOptionIndex ] ) {
			optionsRef.current[ focusedOptionIndex ].scrollIntoView( {
				block: 'nearest',
				behavior: 'smooth',
			} );
		}
	}, [ focusedOptionIndex ] );

	const handleToggle = useCallback( () => {
		if ( disabled ) {
			return;
		}
		setIsOpen( ! isOpen );
	}, [ isOpen, setIsOpen, disabled ] );

	const handleCountrySelect = useCallback(
		event => {
			if ( onCountryChange ) {
				onCountryChange( event );
			}
			setIsOpen( false );
		},
		[ onCountryChange, setIsOpen ]
	);

	const handleSearchChange = useCallback( event => {
		setSearchTerm( event.target.value );
	}, [] );

	const handleKeyDown = useCallback(
		event => {
			if ( ! isOpen ) {
				return;
			}

			switch ( event.key ) {
				case 'ArrowDown':
					event.preventDefault();
					setFocusedOptionIndex( prevIndex => {
						const nextIndex = prevIndex < filteredCountries.length - 1 ? prevIndex + 1 : 0;
						return nextIndex;
					} );
					break;

				case 'ArrowUp':
					event.preventDefault();
					setFocusedOptionIndex( prevIndex => {
						const nextIndex = prevIndex > 0 ? prevIndex - 1 : filteredCountries.length - 1;
						return nextIndex;
					} );
					break;

				case 'Enter':
					event.preventDefault();
					if ( focusedOptionIndex >= 0 && focusedOptionIndex < filteredCountries.length ) {
						const selectedCountryOption = filteredCountries[ focusedOptionIndex ];
						const mockEvent = {
							target: { value: selectedCountryOption.code },
							currentTarget: { value: selectedCountryOption.code },
						};
						if ( onCountryChange ) {
							onCountryChange( mockEvent );
						}
						setIsOpen( false );
					}
					break;

				case 'Escape':
					event.preventDefault();
					setIsOpen( false );
					break;

				default:
					break;
			}
		},
		[ isOpen, filteredCountries, focusedOptionIndex, onCountryChange, setIsOpen ]
	);

	// Don't render if no countries or no selected country
	if ( ! countries.length || ! selectedCountry ) {
		return null;
	}

	const triggerArrowClass = clsx( 'jetpack-combobox-trigger-arrow', {
		'is-open': isOpen,
	} );

	return (
		<div className={ clsx( 'jetpack-custom-combobox', className ) }>
			<button
				className="jetpack-combobox-trigger"
				role="button"
				tabIndex={ 0 }
				onClick={ handleToggle }
				onKeyDown={ event => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						handleToggle();
					} else if ( event.key === 'ArrowDown' ) {
						event.preventDefault();
						if ( ! isOpen ) {
							handleToggle();
						}
					}
				} }
				disabled={ disabled }
				aria-expanded={ isOpen }
				aria-haspopup="listbox"
			>
				<span className="jetpack-combobox-selected">{ selectedCountry.flag }</span>
				<span className={ triggerArrowClass }>&nbsp;</span>
				<span className="jetpack-combobox-selected">{ selectedCountry.value }</span>
			</button>

			{ isOpen && (
				<div className="jetpack-combobox-dropdown jetpack-combobox-open">
					<input
						ref={ searchInputRef }
						className="jetpack-combobox-search"
						type="text"
						placeholder={ __( 'Search countries…', 'jetpack-forms' ) }
						value={ searchTerm }
						onChange={ handleSearchChange }
						onKeyDown={ handleKeyDown }
						role="combobox"
						aria-expanded={ isOpen }
						aria-autocomplete="list"
						aria-activedescendant={
							focusedOptionIndex >= 0
								? `country-option-${ filteredCountries[ focusedOptionIndex ]?.code }`
								: undefined
						}
					/>
					<div className="jetpack-combobox-options" role="listbox">
						{ filteredCountries.map( ( { country, flag, value, code }, index ) => {
							const isFocused = index === focusedOptionIndex;
							const isSelected = selectedCountry?.code === code;

							return (
								<button
									key={ code }
									ref={ el => {
										optionsRef.current[ index ] = el;
									} }
									id={ `country-option-${ code }` }
									className={ clsx( 'jetpack-combobox-option', {
										'is-focused': isFocused,
										'is-selected': isSelected,
									} ) }
									value={ code }
									onClick={ handleCountrySelect }
									onMouseEnter={ () => setFocusedOptionIndex( index ) }
									role="option"
									aria-selected={ isSelected }
									tabIndex={ -1 }
								>
									<span className="jetpack-combobox-option-icon">{ flag }</span>
									<span className="jetpack-combobox-option-value">{ value }</span>
									<span className="jetpack-combobox-option-description">{ country }</span>
								</button>
							);
						} ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default CountryCombobox;
