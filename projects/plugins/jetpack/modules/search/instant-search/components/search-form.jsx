/** @jsx h */

/**
 * External dependencies
 */
import { Component, h } from 'preact';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import JetpackColophon from './jetpack-colophon';
import SearchBox from './search-box';
import SearchFilters from './search-filters';
import SearchSort from './search-sort';
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
				<div className="jetpack-instant-search__form">
					<SearchBox
						isVisible={ this.props.isVisible }
						onChange={ this.onChangeSearch }
						shouldRestoreFocus
						searchQuery={ this.props.searchQuery }
					/>

					<div className="jetpack-instant-search__form-controls">
						{ this.state.widgets.length > 0 && (
							<div
								role="button"
								onClick={ this.toggleFilters }
								onKeyDown={ this.toggleFilters }
								tabIndex="0"
								className="jetpack-instant-search__box-filter-button"
							>
								{ __( 'Filters', 'jetpack' ) }
								<Gridicon
									icon="chevron-down"
									size={ 16 }
									alt="Show search filters"
									aria-hidden="true"
								/>
								<span className="screen-reader-text assistive-text">
									{ this.state.showFilters
										? __( 'Hide filters', 'jetpack' )
										: __( 'Show filters', 'jetpack' ) }
								</span>
							</div>
						) }
						{ this.props.enableSort && (
							<SearchSort
								onChange={ this.onChangeSort }
								resultFormat={ this.props.resultFormat }
								value={ this.props.sort }
							/>
						) }
					</div>
				</div>

				{ /* TODO: Remove this section entirely and use SearchSidebar to show mobile version of filters. */ }
				{ this.state.widgets.length > 0 && this.state.showFilters && (
					<div className="jetpack-instant-search__form-filters">
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
