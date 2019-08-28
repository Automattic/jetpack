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
	renderFilterComponent = ( { filter, results } ) => {
		switch ( filter.type ) {
			case 'date_histogram':
				return results && <SearchFilterDates aggregation={ results } filter={ filter } />;
			case 'taxonomy':
				return results && <SearchFilterTaxonomies aggregation={ results } filter={ filter } />;
			case 'post_type':
				return (
					results && (
						<SearchFilterPostTypes
							aggregation={ results }
							filter={ filter }
							postTypes={ this.props.postTypes }
						/>
					)
				);
		}
	};

	render() {
		const aggregations = get( this.props.results, 'aggregations' );
		return (
			<div id={ `${ this.props.widget.widget_id }-wrapper` }>
				{ get( this.props.widget, 'filters' )
					.map( filter =>
						aggregations ? { filter, results: aggregations[ filter.filter_id ] } : null
					)
					.filter( data => !! data )
					.filter(
						( { results } ) =>
							!! results && Array.isArray( results.buckets ) && results.buckets.length > 0
					)
					.map( this.renderFilterComponent ) }
			</div>
		);
	}
}
