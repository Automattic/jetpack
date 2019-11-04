/** @jsx h */

/**
 * External dependencies
 */
import { Component, h } from 'preact';
import { createPortal } from 'preact/compat';

/**
 * Internal dependencies
 */
import SearchBox from './search-box';
import SearchFilters from './search-filters';
import SearchSortWidget from './search-sort-widget';

import {
	getFilterQuery,
	getSearchQuery,
	getSortQuery,
	setFilterQuery,
	setSearchQuery,
	setSortQuery,
} from '../lib/query-string';

export default class SearchWidget extends Component {
	onChangeFilter = ( filterName, filterValue ) => setFilterQuery( filterName, filterValue );
	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => setSortQuery( sort );

	render() {
		return createPortal(
			<div id={ `${ this.props.widget.widget_id }-portaled-wrapper` }>
				<div className="search-form">
					<SearchBox
						onChangeQuery={ this.onChangeQuery }
						onFocus={ this.props.onSearchFocus }
						onBlur={ this.props.onSearchBlur }
						query={ getSearchQuery() }
					/>
				</div>
				<div className="jetpack-search-sort-wrapper">
					<SearchSortWidget onChange={ this.onChangeSort } value={ getSortQuery() } />
				</div>
				<SearchFilters
					filters={ getFilterQuery() }
					loading={ this.props.isLoading }
					locale={ this.props.locale }
					onChange={ this.onChangeFilter }
					postTypes={ this.props.postTypes }
					results={ this.props.response }
					widget={ this.props.widget }
				/>
			</div>,
			document.getElementById( `${ this.props.widget.widget_id }-wrapper` )
		);
	}
}
