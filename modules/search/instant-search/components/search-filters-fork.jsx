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
	constructor( ...args ) {
		super( ...args );
		this.state = { response: {} };
		this.props.store.subscribe( () => {
			// eslint-disable-next-line no-console
			console.log( 'SearchFilters subscription:', this.props.store.getState() );
			this.setState( { response: this.props.store.getState() } );
		} );
	}

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
		const aggregations = get( this.state.response, 'aggregations', {} );
		return (
			<div className="jetpack-instant-search__filters">
				<table>
					{ Object.keys( aggregations ).map( key => (
						<tr>
							<th scope="row">{ key }</th>
							<td>{ aggregations[ key ].buckets.length }</td>
						</tr>
					) ) }
				</table>
			</div>
		);
	}
}
