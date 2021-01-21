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
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import SearchFilter from './search-filter';
import { mapFilterToFilterKey, mapFilterToType } from '../lib/filters';
import { clearFilters, setFilter } from '../store/actions';
import './search-filters.scss';

class SearchFilters extends Component {
	static defaultProps = {
		showClearFiltersButton: true,
	};

	onChangeFilter = ( filterName, filterValue ) => {
		this.props.setFilter( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

	onClearFilters = event => {
		event.preventDefault();

		if (
			event.type === 'click' ||
			( event.type === 'keydown' && ( event.key === 'Enter' || event.key === ' ' ) )
		) {
			this.props.clearFilters();
			this.props.onChange && this.props.onChange();
		}
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

export default connect( null, { clearFilters, setFilter } )( SearchFilters );
