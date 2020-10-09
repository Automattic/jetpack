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
} from '../lib/query-string';
import PreselectedSearchFilters from './preselected-search-filters';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	state = {
		showFilters: !! this.props.widget,
	};

	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => {
		this.props.onChangeSort( sort );
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

	hasSelectableFilters = () =>
		this.props.widgets.some( widget => Array( widget.filters ) && widget.filters.length > 0 );

	hasPreselectedFilters = () =>
		hasPreselectedFilters( this.props.widgets, this.props.widgetsOutsideOverlay );

	render() {
		return (
			<form autocomplete="off" onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						enableFilters={ this.hasSelectableFilters() || this.hasPreselectedFilters() }
						enableSort={ this.props.enableSort }
						isVisible={ this.props.isVisible }
						onChangeQuery={ this.onChangeQuery }
						onChangeSort={ this.onChangeSort }
						query={ getSearchQuery() }
						shouldRestoreFocus
						showFilters={ this.state.showFilters }
						sort={ this.props.sort }
						toggleFilters={ this.toggleFilters }
					/>
				</div>
				{ ( this.hasSelectableFilters() || this.hasPreselectedFilters() ) &&
					this.state.showFilters && (
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
									showClearFiltersButton={ ! this.hasPreselectedFilters() && index === 0 }
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
