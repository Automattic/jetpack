/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { __, sprintf } from '@wordpress/i18n';

const SearchResultsEmpty = ( { query } ) => {
	return (
		<div className="jetpack-instant-search__search-results-empty">
			{ query && (
				<div>
					<h3>{ sprintf( __( 'No results for "%s".', 'jetpack' ), query ) }</h3>
				</div>
			) }
		</div>
	);
};

export default SearchResultsEmpty;
