/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
// NOTE: We only import the get package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import SearchFilter from './search-filter';

export default class SearchFilters extends Component {
	renderFilterComponent = ( { configuration, results } ) => {
		switch ( configuration.type ) {
			case 'date_histogram':
				return (
					results && (
						<SearchFilter
							aggregation={ results }
							configuration={ configuration }
							locale={ this.props.locale }
							type="date"
							value={ this.props.filters[ `${ configuration.interval }_${ configuration.field }` ] }
							onChange={ this.props.onChange }
						/>
					)
				);
			case 'taxonomy':
				return (
					results && (
						<SearchFilter
							aggregation={ results }
							configuration={ configuration }
							value={ this.props.filters[ configuration.taxonomy ] }
							onChange={ this.props.onChange }
							type="taxonomy"
						/>
					)
				);
			case 'post_type':
				return (
					results && (
						<SearchFilter
							aggregation={ results }
							configuration={ configuration }
							value={ this.props.filters.post_types }
							onChange={ this.props.onChange }
							postTypes={ this.props.postTypes }
							type="postType"
						/>
					)
				);
		}
	};

	render() {
		const aggregations = get( this.props.results, 'aggregations' );
		const cls =
			this.props.loading === true
				? 'jetpack-instant-search__filters-widget jetpack-instant-search__is-loading'
				: 'jetpack-instant-search__filters-widget';

		return (
			<div className={ cls }>
				{ get( this.props.widget, 'filters' )
					.map( configuration =>
						aggregations
							? { configuration, results: aggregations[ configuration.filter_id ] }
							: null
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
