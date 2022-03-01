/**
 * External dependencies
 */
import React, { Fragment, useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line lodash/import-scope
import uniqueId from 'lodash/uniqueId';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import './search-box.scss';

let initiallyFocusedElement = null;
const stealFocusWithInput = inputElement => () => {
	initiallyFocusedElement = document.activeElement;
	inputElement.focus();
};
const restoreFocus = () => initiallyFocusedElement && initiallyFocusedElement.focus();

const SearchBox = props => {
	const [ inputId ] = useState( () => uniqueId( 'jetpack-instant-search__box-input-' ) );
	const inputRef = useRef( null );

	useEffect( () => {
		if ( props.isVisible ) {
			stealFocusWithInput( inputRef.current )();
		} else if ( props.shouldRestoreFocus ) {
			restoreFocus();
		}
	}, [ props.isVisible, props.shouldRestoreFocus ] );

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
						className="search-field jetpack-instant-search__box-input"
						inputMode="search"
						// IE11 will immediately fire an onChange event when the placeholder contains a unicode character.
						// Ensure that the search application is visible before invoking the onChange callback to guard against this.
						onChange={ props.isVisible ? props.onChange : null }
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

					<button className="screen-reader-text assistive-text">
						{ __( 'Search', 'jetpack-search-pkg' ) }
					</button>
				</label>
			</div>
		</Fragment>
	);
};

export default SearchBox;
