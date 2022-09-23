import { __ } from '@wordpress/i18n';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { mapFilterToFilterKey, mapFilterToType, getAvailableStaticFilters } from '../lib/filters';
import { recordStaticFilterSelect } from '../lib/tracks';
import { clearFilters, setFilter, setStaticFilter } from '../store/actions';
import SearchFilter from './search-filter';
import './search-filters.scss';

class SearchFilters extends Component {
	static defaultProps = {
		showClearFiltersButton: true,
		showTitle: true,
	};

	onChangeFilter = ( filterName, filterValue ) => {
		this.props.setFilter( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

	onChangeStaticFilter = ( filterName, filterValue ) => {
		recordStaticFilterSelect( { filterName, filterValue } );
		this.props.setStaticFilter( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

	onClearFilters = event => {
		event.preventDefault();

		this.props.clearFilters();
		this.props.onChange && this.props.onChange();
	};

	hasActiveFilters() {
		return Object.keys( this.props.filters ).length > 0;
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
				value={ this.props.filters[ mapFilterToFilterKey( configuration ) ] }
			/>
		);

	renderStaticFilterComponent = configuration => {
		if ( configuration.hasOwnProperty( 'visible' ) && ! configuration.visible ) {
			return null;
		}

		return (
			<SearchFilter
				aggregation={ [] }
				configuration={ configuration }
				locale={ this.props.locale }
				onChange={ this.onChangeStaticFilter }
				postTypes={ this.props.postTypes }
				type={ mapFilterToType( configuration ) }
				value={ this.props.staticFilters[ mapFilterToFilterKey( configuration ) ] }
			/>
		);
	};

	render() {
		if ( ! this.props.widget ) {
			return null;
		}

		const availableStaticFilters = getAvailableStaticFilters();
		const aggregations = this.props.results?.aggregations;
		return (
			<div className="jetpack-instant-search__search-filters">
				{ this.props.showTitle && (
					<h2 className="jetpack-instant-search__search-filters-title">
						{ __( 'Filter options', 'jetpack-search-pkg' ) }
					</h2>
				) }
				{ this.props.showClearFiltersButton && this.hasActiveFilters() && (
					<button
						class="jetpack-instant-search__clear-filters-link"
						onClick={ this.onClearFilters }
					>
						{ __( 'Clear filters', 'jetpack-search-pkg' ) }
					</button>
				) }

				{ this.props.widget?.filters &&
					this.props.widget.filters.length > 0 &&
					availableStaticFilters.map( this.renderStaticFilterComponent ) }

				{ this.props.widget?.filters
					?.map( configuration =>
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

export default connect( null, { clearFilters, setFilter, setStaticFilter } )( SearchFilters );
