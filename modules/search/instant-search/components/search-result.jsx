/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultMinimal from './search-result-minimal';
import SearchResultProduct from './search-result-product';

const SearchResult = ( { resultFormat, ...props } ) => {
	if ( resultFormat === 'product' ) {
		return <SearchResultProduct { ...props } />;
	}

	return <SearchResultMinimal { ...props } />;
};

export default SearchResult;
