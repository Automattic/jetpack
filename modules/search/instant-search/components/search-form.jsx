/** @jsx h */

/**
 * External dependencies
 */
import { Component, Fragment, h } from 'preact';

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
	state = {
		showFilters: false,
	};

	onChangeFilter = ( filterName, filterValue ) => setFilterQuery( filterName, filterValue );
	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => setSortQuery( sort );

	toggleFilters = () => {
		this.setState( state => ( {
			showFilters: ! state.showFilters,
		} ) );
	};

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
						toggleFilters={ this.toggleFilters }
						showFilters={ this.state.showFilters }
					/>
				</div>
				{ this.state.showFilters && (
					<Fragment>
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
					</Fragment>
				) }
			</form>
		);
	}
}

export default SearchForm;
