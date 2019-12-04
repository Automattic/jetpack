/** @jsx h */

/**
 * External dependencies
 */
import { Component, h } from 'preact';

/**
 * Internal dependencies
 */
import SearchBox from './search-box';
import SearchFilters from './search-filters';
import SearchSort from './search-sort';

import {
	getFilterQuery,
	getSearchQuery,
	getSortQuery,
	setFilterQuery,
	setSearchQuery,
	setSortQuery,
} from '../lib/query-string';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	onChangeFilter = ( filterName, filterValue ) => setFilterQuery( filterName, filterValue );
	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => setSortQuery( sort );

	render() {
		return (
			<form onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="search-form">
					<SearchBox
						onChangeQuery={ this.onChangeQuery }
						onFocus={ this.props.onSearchFocus }
						onBlur={ this.props.onSearchBlur }
						query={ getSearchQuery() }
						widget={ this.props.widget }
					/>
				</div>
				<SearchSort onChange={ this.onChangeSort } value={ getSortQuery() } />
				<SearchFilters
					filters={ getFilterQuery() }
					loading={ this.props.isLoading }
					locale={ this.props.locale }
					onChange={ this.onChangeFilter }
					postTypes={ this.props.postTypes }
					results={ this.props.response }
					widget={ this.props.widget }
				/>
			</form>
		);
	}
}

export default SearchForm;
