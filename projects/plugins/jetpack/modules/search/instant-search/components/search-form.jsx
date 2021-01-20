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
import './search-form.scss';

const noop = event => event.preventDefault();

class SearchForm extends Component {
	state = {
		showFilters: !! this.props.widget,
	};

	static getDerivedStateFromProps( props, state ) {
		// Combine widgets and widgetOutsideOverlay into one reference.
		let widgets = [ ...props.widgets ];
		if ( props.widgetOutsideOverlay?.filters?.length > 0 ) {
			widgets = [ props.widgetOutsideOverlay, ...widgets ];
		}
		return { ...state, widgets };
	}

	onChangeSearch = event => this.props.onChangeSearch( event.currentTarget.value );
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

	render() {
		return (
			<form autocomplete="off" onSubmit={ noop } role="search" className={ this.props.className }>
				<div className="jetpack-instant-search__search-form">
					<SearchBox
						enableFilters={ this.state.widgets.length > 0 }
						enableSort={ this.props.enableSort }
						isVisible={ this.props.isVisible }
						onChangeSearch={ this.onChangeSearch }
						onChangeSort={ this.onChangeSort }
						resultFormat={ this.props.resultFormat }
						shouldRestoreFocus
						showFilters={ this.state.showFilters }
						searchQuery={ this.props.searchQuery }
						sort={ this.props.sort }
						toggleFilters={ this.toggleFilters }
					/>
				</div>
				{ /* TODO: Remove this section entirely and use SearchSidebar to show mobile version of filters. */ }
				{ this.state.widgets.length > 0 && this.state.showFilters && (
					<div className="jetpack-instant-search__search-form-filters">
						<div className="jetpack-instant-search__search-form-filters-arrow" />
						{ this.state.widgets.map( ( widget, index ) => (
							<SearchFilters
								filters={ this.props.filters }
								loading={ this.props.isLoading }
								locale={ this.props.locale }
								onChange={ this.hideFilters }
								postTypes={ this.props.postTypes }
								results={ this.props.response }
								showClearFiltersButton={ index === 0 }
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
