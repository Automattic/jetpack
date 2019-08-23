/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
// NOTE: We only import the debounce package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import SearchFilterDates from './search-filter-dates';
import SearchFilterTaxonomies from './search-filter-taxonomies';
import SearchFilterPostTypes from './search-filter-post-types';

export default class SearchFiltersWidget extends Component {
	renderFilterComponent( aggregations ) {
		return filter => {
			const results = aggregations ? aggregations[ filter.filter_id ] : null;
			switch ( filter.type ) {
				case 'date_histogram':
					return <SearchFilterDates aggregation={ results } filter={ filter } />;
				case 'taxonomy':
					return <SearchFilterTaxonomies aggregation={ results } filter={ filter } />;
				case 'post_type':
					return <SearchFilterPostTypes aggregation={ results } filter={ filter } />;
			}
		};
	}

	render() {
		return (
			<div id={ `${ this.props.widget.widget_id }-wrapper` }>
				{ get( this.props.widget, 'filters' ).map(
					this.renderFilterComponent( get( this.props.results, 'aggregations' ) )
				) }
			</div>
		);
	}
}
