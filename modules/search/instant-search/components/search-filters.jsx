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
import { mapFilterToFilterKey, mapFilterToType } from '../lib/filters';

export default class SearchFilters extends Component {
	static defaultProps = {
		showClearFiltersButton: true,
	};

	onChangeFilter = ( filterName, filterValue ) => {
		setFilterQuery( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

	onClearFilters = event => {
		event.preventDefault();

		if (
			event.type === 'click' ||
			( event.type === 'keydown' && ( event.key === 'Enter' || event.key === ' ' ) )
		) {
			clearFiltersFromQuery();
			this.props.onChange && this.props.onChange();
		}
	};

	hasActiveFilters() {
		return Object.keys( this.getFilters() )
			.map( key => this.getFilters()[ key ] )
			.some( value => Array.isArray( value ) && value.length );
	}

	getFilters() {
		return getFilterQuery();
	}

	renderFilterComponent = ( { configuration, results } ) =>
		results && (
			<SearchFilter
				aggregation={ results }
				configuration={ configuration }
				locale={ this.props.locale }
				onChange={ this.onChangeFilter }
				postTypes={ this.props.postTypes }
				type={ mapFilterToType( configuration ) }
				value={ this.getFilters()[ mapFilterToFilterKey( configuration ) ] }
			/>
		);

	render() {
		if ( ! this.props.widget ) {
			return null;
		}

		const aggregations = get( this.props.results, 'aggregations' );
		return (
			<div className="jetpack-instant-search__filters">
				{ this.props.showClearFiltersButton && this.hasActiveFilters() && (
					<a
						class="jetpack-instant-search__clear-filters-link"
						href="#"
						onClick={ this.onClearFilters }
						onKeyDown={ this.onClearFilters }
						role="button"
						tabIndex="0"
					>
						{ __( 'Clear filters', 'jetpack' ) }
					</a>
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
