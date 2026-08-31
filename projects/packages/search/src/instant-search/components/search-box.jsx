import { __ } from '@wordpress/i18n';
import * as React from 'react';
import { Fragment, useState, useEffect, useRef, forwardRef } from 'react';
import { OVERLAY_SEARCH_BOX_INPUT_CLASS_NAME } from '../lib/constants';
import Gridicon from './gridicon';
import './search-box.scss';

let initiallyFocusedElement = null;
const stealFocusWithInput = inputElement => () => {
	initiallyFocusedElement = inputElement.ownerDocument.activeElement;
	inputElement.focus();
};
const restoreFocus = () => initiallyFocusedElement && initiallyFocusedElement.focus();

let searchBoxCounter = 0;

const SearchBox = forwardRef( ( props, ref ) => {
	const [ inputId ] = useState( () => `jetpack-instant-search__box-input-${ ++searchBoxCounter }` );
	const localInputRef = useRef( null );
	const inputRef = ref || localInputRef;

	useEffect( () => {
		if ( props.isVisible && inputRef.current ) {
			stealFocusWithInput( inputRef.current )();
		} else if ( props.shouldRestoreFocus ) {
			restoreFocus();
		}
	}, [ props.isVisible, props.shouldRestoreFocus, inputRef ] );

	return (
		<Fragment>
			<div className="jetpack-instant-search__box">
				{ /* TODO: Add support for preserving label text */ }
				<label className="jetpack-instant-search__box-label" htmlFor={ inputId }>
					<div className="jetpack-instant-search__box-gridicon">
						<Gridicon icon="search" size={ 24 } />
					</div>
					<input
						autoComplete="off"
						id={ inputId }
						className={ 'search-field ' + OVERLAY_SEARCH_BOX_INPUT_CLASS_NAME }
						inputMode="search"
						// IE11 will immediately fire an onChange event when the placeholder contains a unicode character.
						// Ensure that the search application is visible before invoking the onChange callback to guard against this.
						onChange={ props.isVisible ? props.onChange : null }
						onKeyDown={ props.onKeyDown }
						onBlur={ props.onBlur }
						ref={ inputRef }
						placeholder={ __( 'Search…', 'jetpack-search-pkg' ) }
						type="search"
						value={ props.searchQuery ?? '' }
					/>

					{ typeof props.searchQuery === 'string' && props.searchQuery.length > 0 && (
						/* Translators: Button is used to clear the search input query. */
						<input
							type="button"
							value={ __( 'clear', 'jetpack-search-pkg' ) }
							onClick={ props.onClear }
						/>
					) }

					<button className="screen-reader-text assistive-text" tabIndex="-1">
						{ __( 'Search', 'jetpack-search-pkg' ) }
					</button>
				</label>
			</div>
		</Fragment>
	);
} );

export default SearchBox;
