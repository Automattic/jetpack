import React, { Component } from 'react';
import { connect } from 'react-redux';
import { mapFilterToFilterKey, mapFilterToType, getAvailableStaticFilters } from '../lib/filters';
import { setStaticFilter } from '../store/actions';
import SearchFilter from './search-filter';

import './tabbed-search-filters.scss';

class TabbedSearchFilters extends Component {
	onChangeStaticFilter = ( filterName, filterValue ) => {
		this.props.setStaticFilter( filterName, filterValue );
		this.props.onChange && this.props.onChange();
	};

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
				variation="tabbed"
			/>
		);
	};

	render() {
		const availableStaticFilters = getAvailableStaticFilters( 'tabbed' );
		if ( ! availableStaticFilters.length ) {
			return null;
		}
		return (
			<div className="jetpack-instant-search__search-tabbed-filters">
				{ availableStaticFilters.map( this.renderStaticFilterComponent ) }
			</div>
		);
	}
}

export default connect(
	state => ( {
		staticFilters: state.staticFilters,
	} ),
	{ setStaticFilter }
)( TabbedSearchFilters );
