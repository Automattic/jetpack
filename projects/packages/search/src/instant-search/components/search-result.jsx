import React, { Component } from 'react';
import { RESULT_FORMAT_EXPANDED, RESULT_FORMAT_PRODUCT } from '../lib/constants';
import SearchResultExpanded from './search-result-expanded';
import SearchResultMinimal from './search-result-minimal';
import SearchResultProduct from './search-result-product';
import './search-result.scss';

class SearchResult extends Component {
	render() {
		if ( this.props.resultFormat === RESULT_FORMAT_PRODUCT ) {
			return <SearchResultProduct { ...this.props } />;
		} else if ( this.props.resultFormat === RESULT_FORMAT_EXPANDED ) {
			return <SearchResultExpanded { ...this.props } />;
		}

		return <SearchResultMinimal { ...this.props } />;
	}
}

export default SearchResult;
