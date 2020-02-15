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
import SearchSort from './search-sort';

import {
	getFilterQuery,
	getSearchQuery,
	getSortQuery,
	setSearchQuery,
	setSortQuery,
} from '../lib/query-string';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	state = {
		showFilters: !! this.props.widget,
	};

	onChangeQuery = event => setSearchQuery( event.target.value );
	onChangeSort = sort => setSortQuery( sort );

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
				<div className="search-form jetpack-instant-search__search-form">
					<SearchBox
						enableFilters
						onChangeQuery={ this.onChangeQuery }
						query={ getSearchQuery() }
						showFilters={ this.state.showFilters }
						showLogo={ this.props.showLogo }
						toggleFilters={ this.toggleFilters }
						widget={ this.props.widget }
					/>
				</div>
				{ this.state.showFilters && (
					<div className="jetpack-instant-search__search-form-filters">
						<div className="jetpack-instant-search__search-form-filters-arrow" />
						<SearchSort onChange={ this.onChangeSort } value={ getSortQuery() } />
						{ this.props.widgets.map( widget => (
							<SearchFilters
								filters={ getFilterQuery() }
								loading={ this.props.isLoading }
								locale={ this.props.locale }
								onChange={ this.hideFilters }
								postTypes={ this.props.postTypes }
								results={ this.props.response }
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
