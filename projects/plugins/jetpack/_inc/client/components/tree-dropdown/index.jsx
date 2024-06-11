import './style.scss';
import { Icon, closeSmall, search } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TreeSelector from '../tree-selector';

const TreeDropdown = props => {
	const { items, onChange, selectedItems, disabled } = props;
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isDropdownVisible, setIsDropdownVisible ] = useState( false );
	const dropdownRef = useRef( null );
	const inputRef = useRef( null );
	const className = clsx(
		'tree-dropdown__input-container',
		isDropdownVisible && 'active',
		disabled && 'disabled'
	);

	const tags = useMemo(
		() => selectedItems?.map( id => items.find( item => item.id === id ) ).filter( Boolean ) || [],
		[ selectedItems, items ]
	);

	const showDropdown = useCallback( () => setIsDropdownVisible( true ), [] );

	const handleInputChange = useCallback( e => {
		setInputValue( e.target.value );
	}, [] );

	const removeTag = useCallback( tag => onChange( tag.id, false ), [ onChange ] );

	const handleDelete = useCallback(
		tag => e => {
			e.stopPropagation();
			removeTag( tag );
		},
		[ removeTag ]
	);

	const handleInputKeyDown = useCallback(
		e => {
			if ( e.key === 'Backspace' && ! inputValue ) {
				removeTag( tags[ tags.length - 1 ] );
			} else if ( e.key === 'Escape' ) {
				setIsDropdownVisible( false );
				setInputValue( '' );
				inputRef.current.blur();
			}
		},
		[ inputValue, removeTag, tags ]
	);

	const handleClickOutside = useCallback( event => {
		if ( dropdownRef.current && ! dropdownRef.current.contains( event.target ) ) {
			setIsDropdownVisible( false );
		}
	}, [] );

	useEffect( () => {
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
		};
	}, [ handleClickOutside ] );

	const onVisibleAreaClick = useCallback( () => {
		showDropdown();
		inputRef.current.focus();
	}, [ showDropdown, inputRef ] );

	return (
		<div className="tree-dropdown" ref={ dropdownRef }>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
			<div className={ className } onClick={ onVisibleAreaClick }>
				<Icon icon={ search } />
				{ tags.map( ( tag, index ) => (
					<span key={ index } className="tree-dropdown__tag">
						{ tag.name }
						<button
							onClick={ handleDelete( tag ) }
							className="tree-dropdown__tag-remove-button"
							disabled={ disabled }
							type="button"
						>
							<Icon icon={ closeSmall } />
						</button>
					</span>
				) ) }
				<input
					className="tree-dropdown__input"
					ref={ inputRef }
					type="text"
					value={ inputValue }
					onFocus={ showDropdown }
					onChange={ handleInputChange }
					onKeyDown={ handleInputKeyDown }
					disabled={ disabled }
				/>
			</div>
			<div className="tree-dropdown__dropdown-container">
				<div
					className={ clsx( 'tree-dropdown__dropdown', {
						visible: isDropdownVisible,
					} ) }
				>
					<div
						className={ clsx( 'tree-dropdown-colapsable', {
							hide: ! isDropdownVisible,
						} ) }
					>
						<TreeSelector
							items={ items }
							selectedItems={ selectedItems }
							disabled={ disabled }
							onChange={ onChange }
							keyword={ inputValue }
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TreeDropdown;
