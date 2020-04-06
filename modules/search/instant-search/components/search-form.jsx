/** @jsx h */

/**
 * External dependencies
 */
import { Component, h } from 'preact';

/**
 * Internal dependencies
 */
import JetpackColophon from './jetpack-colophon';
import SearchBox from './search-box';
import SearchFilters from './search-filters';

import {
	getFilterQuery,
	getSearchQuery,
	hasPreselectedFilters,
	setSearchQuery,
	setSortQuery,
} from '../lib/query-string';
import PreselectedSearchFilters from './preselected-search-filters';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	state = {
		showFilters: !! this.props.widget,
	};

	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => {
		setSortQuery( sort );
		this.hideFilters();
	};

	hideFilters = () => this.setState( () => ( { showFilters: false } ) );
	toggleFilters = event => {
		if (
			event.type === 'click' ||
			( event.type === 'keydown' && ( event.key === 'Enter' || event.key === ' ' ) )
		) {
			// Prevent page scroll from pressing spacebar
			if ( event.key === ' ' ) {
				event.preventDefault();
			}
			this.setState( state => ( { showFilters: ! state.showFilters } ) );
		}
	};

	render() {
		return (
			<form onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						enableFilters
						isVisible={ this.props.isVisible }
						onChangeQuery={ this.onChangeQuery }
						onChangeSort={ this.onChangeSort }
						query={ getSearchQuery() }
						showFilters={ this.state.showFilters }
						toggleFilters={ this.toggleFilters }
						widget={ this.props.widget }
					/>
				</div>
				{ this.state.showFilters && (
					<div className="jetpack-instant-search__search-form-filters">
						<div className="jetpack-instant-search__search-form-filters-arrow" />
						<PreselectedSearchFilters
							loading={ this.props.isLoading }
							locale={ this.props.locale }
							postTypes={ this.props.postTypes }
							results={ this.props.response }
							widgets={ this.props.widgets }
							widgetsOutsideOverlay={ this.props.widgetsOutsideOverlay }
						/>
						{ this.props.widgets.map( ( widget, index ) => (
							<SearchFilters
								filters={ getFilterQuery() }
								loading={ this.props.isLoading }
								locale={ this.props.locale }
								onChange={ this.hideFilters }
								postTypes={ this.props.postTypes }
								results={ this.props.response }
								showClearFiltersButton={
									! hasPreselectedFilters( this.props.widgets, this.props.widgetsOutsideOverlay ) &&
									index === 0
								}
								widget={ widget }
							/>
						) ) }
						<JetpackColophon locale={ this.props.locale } />
					</div>
				) }
			</form>
		);
	}
}

export default SearchForm;
