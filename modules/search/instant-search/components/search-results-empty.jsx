/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { __, sprintf } from '@wordpress/i18n';

const SearchResultsEmpty = ( { query } ) => {
	if ( ! query ) {
		return null;
	}

	return (
		<div className="jetpack-instant-search__search-results-empty">
			<h3>{ sprintf( __( 'No results for "%s".', 'jetpack' ), query ) }</h3>
		</div>
	);
};

export default SearchResultsEmpty;
