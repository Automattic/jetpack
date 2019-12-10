/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line lodash/import-scope
import uniqueId from 'lodash/uniqueId';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';

function ignoreEnterKey( event ) {
	if ( event.key === 'Enter' ) {
		// Prevent form submission
		event.preventDefault();
	}
}

const SearchBox = props => {
	const [ inputId ] = useState( () => uniqueId( 'jetpack-instant-search__box-input-' ) );

	return (
		<div className="jetpack-instant-search__box">
			{ /* TODO: Add support for preserving label text */ }
			<label htmlFor={ inputId } className="screen-reader-text">
				{ __( 'Site Search', 'jetpack' ) }
			</label>
			<input
				id={ inputId }
				className="search-field jetpack-instant-search__box-input"
				onKeyPress={ ignoreEnterKey }
				onInput={ props.onChangeQuery }
				onFocus={ props.onFocus }
				onBlur={ props.onBlur }
				ref={ props.appRef }
				placeholder={ __( 'Search…', 'jetpack' ) }
				type="search"
				value={ props.query }
			/>
			{ ! props.widget && (
				/* Using role='button' rather than button element so we retain control over styling */
				<div
					role="button"
					onClick={ props.toggleFilters }
					onKeyDown={ props.toggleFilters }
					tabIndex="0"
					className="jetpack-instant-search__box-filter-icon"
				>
					<Gridicon icon="filter" alt="Search filter icon" aria-hidden="true" />
					<span class="screen-reader-text">
						{ props.showFilters ? __( 'Hide filters' ) : __( 'Show filters ' ) }
					</span>
				</div>
			) }
			<button className="screen-reader-text">{ __( 'Search', 'jetpack' ) }</button>
		</div>
	);
};

export default SearchBox;
