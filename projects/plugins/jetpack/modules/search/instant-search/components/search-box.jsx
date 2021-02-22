/** @jsx h */

/**
 * External dependencies
 */
import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
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
					<span className="screen-reader-text assistive-text">
						{ __( 'Site Search', 'jetpack' ) }
					</span>
					<div className="jetpack-instant-search__box-gridicon">
						<Gridicon icon="search" size={ 24 } />
					</div>
					<input
						autocomplete="off"
						id={ inputId }
						className="search-field jetpack-instant-search__box-input"
						inputmode="search"
						onInput={ props.onChange }
						ref={ inputRef }
						placeholder={ __( 'Search…', 'jetpack' ) }
						type="search"
						value={ props.searchQuery }
					/>

					<button className="screen-reader-text assistive-text">
						{ __( 'Search', 'jetpack' ) }
					</button>
				</label>
			</div>
		</Fragment>
	);
};

export default SearchBox;
