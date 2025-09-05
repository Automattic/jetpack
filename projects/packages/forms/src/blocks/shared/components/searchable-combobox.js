import { KeyboardShortcuts } from '@wordpress/components';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';

/**
 * Combobox Component
 *
 * A reusable combobox component for selecting options with search functionality.
 * Handles its own state management for open/closed state, filtering, and selection.
 * Uses WordPress KeyboardShortcuts component for proper block editor keyboard event handling.
 *
 * @param {object}   props                    - The component props
 * @param {Array}    props.options            - Array of country objects with code, country, flag, and value properties
 * @param {string}   props.selectedOptionCode - The currently selected country code
 * @param {Function} props.onOptionChange     - Callback function called when a country is selected
 * @param {boolean}  props.isOpen             - External control for combobox open state
 * @param {Function} props.onOpenChange       - Callback function for open state changes
 * @param {string}   props.className          - Additional CSS class names
 * @param {boolean}  props.disabled           - Whether the combobox is disabled
 * @return {Element|null} The SearchableCombobox component or null if no options/selectedOption
 */
const SearchableCombobox = ( {
	options = [],
	selectedOptionCode = null,
	onOptionChange,
	isOpen: externalIsOpen = false,
	onOpenChange,
	className = '',
	disabled = false,
} ) => {
	const [ internalIsOpen, setInternalIsOpen ] = useState( false );
	const [ filteredOptions, setFilteredOptions ] = useState( [] );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ selectedOption, setSelectedOption ] = useState( null );
	const [ focusedOptionIndex, setFocusedOptionIndex ] = useState( -1 );
	const searchInputRef = useRef( null );
	const optionsRef = useRef( [] );

	// Use external open state if provided, otherwise use internal state
	const isOpen = onOpenChange ? externalIsOpen : internalIsOpen;
	const setIsOpen = onOpenChange || setInternalIsOpen;

	// Initialize filtered options when options change
	useEffect( () => {
		setFilteredOptions( options );
	}, [ options ] );

	// Update selected country when selectedOptionCode or options change
	useEffect( () => {
		if ( ! selectedOptionCode || ! options.length ) {
			setSelectedOption( null );
			return;
		}

		const country = options.find( option => option.code === selectedOptionCode );
		setSelectedOption( country || null );
	}, [ selectedOptionCode, options ] );

	// Filter options based on search term
	useEffect( () => {
		if ( ! searchTerm ) {
			setFilteredOptions( options );
			return;
		}

		const filtered = options.filter(
			country =>
				country.country.toLowerCase().includes( searchTerm.toLowerCase() ) ||
				country.value.toLowerCase().includes( searchTerm.toLowerCase() ) ||
				country.code.toLowerCase().includes( searchTerm.toLowerCase() )
		);
		setFilteredOptions( filtered );
	}, [ searchTerm, options ] );

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

	// Reset focused option when filtered options change
	useEffect( () => {
		setFocusedOptionIndex( -1 );
	}, [ filteredOptions ] );

	// Scroll focused option into view
	useEffect( () => {
		if ( focusedOptionIndex >= 0 && optionsRef.current[ focusedOptionIndex ] ) {
			optionsRef.current[ focusedOptionIndex ].scrollIntoView( {
				block: 'nearest',
				behavior: 'auto',
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
			if ( onOptionChange ) {
				onOptionChange( event );
			}
			setIsOpen( false );
		},
		[ onOptionChange, setIsOpen ]
	);

	const handleSearchChange = useCallback( event => {
		setSearchTerm( event.target.value );
	}, [] );

	// Keyboard shortcut handlers - using consistent function references as required by KeyboardShortcuts
	const handleArrowDown = useCallback(
		event => {
			if ( ! isOpen ) {
				return;
			}
			event.preventDefault();
			setFocusedOptionIndex( prevIndex => {
				const nextIndex = prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0;
				return nextIndex;
			} );
		},
		[ isOpen, filteredOptions.length, setFocusedOptionIndex ]
	);

	const handleArrowUp = useCallback(
		event => {
			if ( ! isOpen ) {
				return;
			}
			event.preventDefault();
			setFocusedOptionIndex( prevIndex => {
				const nextIndex = prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1;
				return nextIndex;
			} );
		},
		[ isOpen, filteredOptions.length, setFocusedOptionIndex ]
	);

	const handleEnter = useCallback(
		event => {
			if ( ! isOpen ) {
				return;
			}
			event.preventDefault();
			if ( focusedOptionIndex >= 0 && focusedOptionIndex < filteredOptions.length ) {
				const selectedCountryOption = filteredOptions[ focusedOptionIndex ];
				const mockEvent = {
					target: { value: selectedCountryOption.code },
					currentTarget: { value: selectedCountryOption.code },
				};
				if ( onOptionChange ) {
					onOptionChange( mockEvent );
				}
				setIsOpen( false );
			}
		},
		[ isOpen, focusedOptionIndex, filteredOptions, onOptionChange, setIsOpen ]
	);

	const handleEscape = useCallback(
		event => {
			if ( ! isOpen ) {
				return;
			}
			event.preventDefault();
			setIsOpen( false );
		},
		[ isOpen, setIsOpen ]
	);

	// Keyboard shortcuts object for KeyboardShortcuts component
	const shortcuts = {
		down: handleArrowDown,
		up: handleArrowUp,
		enter: handleEnter,
		esc: handleEscape,
	};

	// Don't render if no options or no selected country
	if ( ! options.length || ! selectedOption ) {
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
				<span className="jetpack-combobox-selected">{ selectedOption.flag }</span>
				<span className={ triggerArrowClass }>&nbsp;</span>
				<span className="jetpack-combobox-selected">{ selectedOption.value }</span>
			</button>

			{ isOpen && (
				<KeyboardShortcuts bindGlobal={ true } shortcuts={ shortcuts }>
					<div className="jetpack-combobox-dropdown jetpack-combobox-open">
						<input
							ref={ searchInputRef }
							className="jetpack-combobox-search"
							type="text"
							placeholder={ __( 'Search countries…', 'jetpack-forms' ) }
							value={ searchTerm }
							onChange={ handleSearchChange }
							role="combobox"
							aria-expanded={ isOpen }
							aria-autocomplete="list"
							aria-activedescendant={
								focusedOptionIndex >= 0
									? `country-option-${ filteredOptions[ focusedOptionIndex ]?.code }`
									: undefined
							}
						/>
						<div className="jetpack-combobox-options" role="listbox">
							{ filteredOptions.map( ( { country, flag, value, code }, index ) => {
								const isFocused = index === focusedOptionIndex;
								const isSelected = selectedOption?.code === code;

								return (
									<button
										key={ code }
										ref={ el => {
											optionsRef.current[ index ] = el;
										} }
										id={ `country-option-${ code }` }
										className={ clsx( 'jetpack-combobox-option', {
											'is-focused': isFocused,
											'jetpack-combobox-option-selected': isSelected,
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
				</KeyboardShortcuts>
			) }
		</div>
	);
};

export default SearchableCombobox;
