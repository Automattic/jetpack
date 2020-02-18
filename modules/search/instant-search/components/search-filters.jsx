/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';
import { __ } from '@wordpress/i18n';
// NOTE: We only import the get package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import SearchFilter from './search-filter';
import { setFilterQuery, getFilterQuery, clearFiltersFromQuery } from '../lib/query-string';

export default class SearchFilters extends Component {
	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

	onClearFilters = () => {
		clearFiltersFromQuery();
		this.props.onChange && this.props.onChange();
	};

	hasActiveFilters() {
		return Object.keys( this.getFilters() )
			.map( key => this.getFilters()[ key ] )
			.some( value => Array.isArray( value ) && value.length );
	}

	getFilters() {
		return getFilterQuery();
	}

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
							value={ this.getFilters()[ `${ configuration.interval }_${ configuration.field }` ] }
							onChange={ this.onChangeFilter }
						/>
					)
				);
			case 'taxonomy':
				return (
					results && (
						<SearchFilter
							aggregation={ results }
							configuration={ configuration }
							value={ this.getFilters()[ configuration.taxonomy ] }
							onChange={ this.onChangeFilter }
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
							value={ this.getFilters().post_types }
							onChange={ this.onChangeFilter }
							postTypes={ this.props.postTypes }
							type="postType"
						/>
					)
				);
		}
	};

	render() {
		if ( ! this.props.widget ) {
			return null;
		}

		const aggregations = get( this.props.results, 'aggregations' );
		const cls =
			this.props.loading === true
				? 'jetpack-instant-search__filters jetpack-instant-search__is-loading'
				: 'jetpack-instant-search__filters';

		return (
			<div className={ cls }>
				{ this.hasActiveFilters() && (
					<button
						class="jetpack-instant-search__clear-filters-button"
						onClick={ this.onClearFilters }
					>
						{ __( 'Clear Filters', 'jetpack' ) }
					</button>
				) }
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
