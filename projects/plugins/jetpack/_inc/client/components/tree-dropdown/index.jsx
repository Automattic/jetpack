import './style.scss';
import { Icon, closeSmall, search } from '@wordpress/icons';
import classNames from 'classnames';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TreeSelector from '../tree-selector';

const TreeDropdown = props => {
	const { items, onChange, selectedItems, disabled } = props;
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isDropdownVisible, setIsDropdownVisible ] = useState( false );
	const dropdownRef = useRef( null );
	const inputRef = useRef( null );
	const className = classNames(
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

	const handleDelete = useCallback( tag => () => removeTag( tag ), [ removeTag ] );

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

	return (
		<div className="tree-dropdown" ref={ dropdownRef }>
			<div className={ className }>
				<Icon icon={ search } />
				{ tags.map( ( tag, index ) => (
					<span key={ index } className="tree-dropdown__tag">
						{ tag.name }
						<button
							onClick={ handleDelete( tag ) }
							className="tree-dropdown__tag-remove-button"
							disabled={ disabled }
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

			{ isDropdownVisible && (
				<div className="tree-dropdown__dropdown-container">
					<div className="tree-dropdown__dropdown">
						<TreeSelector
							items={ items }
							selectedItems={ selectedItems }
							disabled={ disabled }
							onChange={ onChange }
							keyword={ inputValue }
						/>
					</div>
				</div>
			) }
		</div>
	);
};

export default TreeDropdown;
