/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultMinimal from './search-result-minimal';
import SearchResultProduct from './search-result-product';

class SearchResult extends Component {
	render() {
		if ( this.props.resultFormat === 'product' ) {
			return <SearchResultProduct { ...this.props } />;
		}

		return <SearchResultMinimal { ...this.props } />;
	}
}

export default SearchResult;
