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
import SearchSort from './search-sort';
import { getSortQuery } from '../lib/query-string';

let initiallyFocusedElement = null;

const SearchBox = props => {
	const [ inputId ] = useState( () => uniqueId( 'jetpack-instant-search__box-input-' ) );
	const inputRef = useRef( null );

	const cb = overlayElement => event => {
		if (
			event &&
			event.target &&
			! event.target.classList.contains( '.jetpack-instant-search__overlay' )
		) {
			return;
		}

		if ( ! overlayElement.classList.contains( 'is-hidden' ) ) {
			initiallyFocusedElement = document.activeElement;
			inputRef.current.focus();
			return;
		}
		initiallyFocusedElement && initiallyFocusedElement.focus();
	};

	useEffect( () => {
		const overlayElement = document.querySelector( '.jetpack-instant-search__overlay' );
		overlayElement.addEventListener( 'transitionend', cb( overlayElement ), true );
		cb( overlayElement )(); // invoke focus if page loads with overlay already present
		return () => {
			overlayElement.removeEventListener( 'transitionend', cb );
		};
	}, [] );

	return (
		<Fragment>
			<div className="jetpack-instant-search__box">
				{ /* TODO: Add support for preserving label text */ }
				<label className="jetpack-instant-search__box-label" htmlFor={ inputId }>
					<span className="screen-reader-text">{ __( 'Site Search', 'jetpack' ) }</span>
					<div className="jetpack-instant-search__box-gridicon">
						<Gridicon icon="search" size={ 24 } />
					</div>
					<input
						id={ inputId }
						className="search-field jetpack-instant-search__box-input"
						onInput={ props.onChangeQuery }
						ref={ inputRef }
						placeholder={ __( 'Search…', 'jetpack' ) }
						type="search"
						value={ props.query }
					/>

					<button className="screen-reader-text">{ __( 'Search', 'jetpack' ) }</button>
				</label>
			</div>

			{ props.enableFilters && ! props.widget && (
				<div className="jetpack-instant-search__box-filter-area">
					<div
						role="button"
						onClick={ props.toggleFilters }
						onKeyDown={ props.toggleFilters }
						tabIndex="0"
						className="jetpack-instant-search__box-filter-button"
					>
						{ __( 'Filters', 'jetpack' ) }
						<Gridicon
							icon="chevron-down"
							size={ 16 }
							alt="Show search filters"
							aria-hidden="true"
						/>
						<span className="screen-reader-text">
							{ props.showFilters
								? __( 'Hide filters', 'jetpack' )
								: __( 'Show filters', 'jetpack' ) }
						</span>
					</div>
					<SearchSort onChange={ props.onChangeSort } value={ getSortQuery() } />
				</div>
			) }
		</Fragment>
	);
};

export default SearchBox;
