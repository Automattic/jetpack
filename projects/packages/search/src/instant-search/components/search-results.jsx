/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import React, { Component, Fragment } from 'react';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import Notice from './notice';
import ScrollButton from './scroll-button';
import SearchControls from './search-controls';
import SearchForm from './search-form';
import SearchResult from './search-result';
import SearchSidebar from './sidebar';
import { getConstrastingColor } from '../lib/colors';
import { getAvailableStaticFilters } from '../lib/filters';
import { MULTISITE_NO_GROUP_VALUE } from '../lib/constants';

/**
 * Style dependencies
 */
import './search-results.scss';

class SearchResults extends Component {
	state = {
		shouldShowMobileSecondary: false,
	};

	toggleMobileSecondary = event => {
		if (
			event.type === 'click' ||
			( event.type === 'keydown' && ( event.key === 'Enter' || event.key === ' ' ) )
		) {
			// Prevent page scroll from pressing spacebar
			if ( event.key === ' ' ) {
				event.preventDefault();
			}
			this.setState( state => ( {
				shouldShowMobileSecondary: ! state.shouldShowMobileSecondary,
			} ) );
		}
	};

	hasFilterOptions() {
		let widgets = [ ...this.props.widgets ];
		if ( this.props.widgetOutsideOverlay?.filters?.length > 0 ) {
			widgets = [ this.props.widgetOutsideOverlay, ...widgets ];
		}
		return widgets.length > 0;
	}

	getSearchTitle() {
		const { total = 0, corrected_query = false } = this.props.response;
		const hasQuery = this.props.searchQuery !== '';
		const hasCorrectedQuery = corrected_query !== false;
		const num = new Intl.NumberFormat().format( total );
		const isMultiSite =
			this.props.staticFilters &&
			this.props.staticFilters.group_id &&
			this.props.staticFilters.group_id !== MULTISITE_NO_GROUP_VALUE;

		if ( this.props.isLoading ) {
			if ( ! hasQuery ) {
				return __( 'Loading popular results…', 'jetpack-search-pkg' );
			}

			return __( 'Searching…', 'jetpack-search-pkg', /* dummy arg to avoid bad minification */ 0 );
		}

		if ( total === 0 || this.props.hasError ) {
			return __( 'No results found', 'jetpack-search-pkg' );
		}

		if ( hasQuery && hasCorrectedQuery ) {
			return sprintf(
				/* translators: %1$s: number of results. %2$s: the corrected search query. */
				_n(
					'Found %1$s result for "%2$s"',
					'Found %1$s results for "%2$s"',
					total,
					'jetpack-search-pkg'
				),
				num,
				corrected_query
			);
		} else if ( isMultiSite ) {
			const group = getAvailableStaticFilters().filter( item => item.filter_id === 'group_id' );
			const allP2 =
				group.length === 1 && group[ 0 ].values
					? group[ 0 ].values.filter( item => item.value !== MULTISITE_NO_GROUP_VALUE )
					: {};
			const p2Name = allP2[ 0 ]?.name ? allP2[ 0 ].name : __( 'All P2', 'jetpack-search-pkg' );
			return sprintf(
				/* translators: %1$s: number of results. - %2$s: site name. */
				_n(
					'Found %1$s result in %2$s',
					'Found %1$s results in %2$s',
					total,
					'jetpack-search-pkg'
				),
				num,
				p2Name
			);
		} else if ( hasQuery ) {
			return sprintf(
				/* translators: %s: number of results. */
				_n( 'Found %s result', 'Found %s results', total, 'jetpack-search-pkg' ),
				num,
				this.props.searchQuery
			);
		}

		return __( 'Showing popular results', 'jetpack-search-pkg' );
	}

	renderPrimarySection() {
		const { highlightColor, searchQuery } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.props.response;
		const textColor = getConstrastingColor( highlightColor );
		const hasCorrectedQuery = corrected_query !== false;
		const hasResults = total > 0;

		return (
			<Fragment>
				<style
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: `
							.jetpack-instant-search *::selection,
							.jetpack-instant-search .jetpack-instant-search__search-results .jetpack-instant-search__search-results-primary .jetpack-instant-search__search-result mark {
								color: ${ textColor };
								background-color: ${ highlightColor };
							}
						`,
					} }
				/>
				<h2 className="jetpack-instant-search__search-results-title">{ this.getSearchTitle() }</h2>

				{ hasResults && hasCorrectedQuery && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{
							/* translators: %s: Search query. */
							sprintf( __( 'No results for "%s"', 'jetpack-search-pkg' ), searchQuery )
						}
					</p>
				) }
				{ this.props.hasError && (
					<Notice type="warning">
						{ __(
							"It looks like you're offline. Please reconnect for results.",
							'jetpack-search-pkg'
						) }
					</Notice>
				) }
				{ hasResults && ! this.props.hasError && this.props.response._isOffline && (
					<Notice type="warning">
						{ __(
							"It looks like you're offline. Please reconnect to load the latest results.",
							'jetpack-search-pkg'
						) }
					</Notice>
				) }
				{ hasResults && ! this.props.hasError && (
					<ol
						className={ `jetpack-instant-search__search-results-list is-format-${ this.props.resultFormat }` }
					>
						{ results.map( ( result, index ) => (
							<SearchResult
								index={ index }
								staticFilters={ this.props.staticFilters }
								isPhotonEnabled={ this.props.isPhotonEnabled }
								locale={ this.props.locale }
								railcar={ this.props.isVisible ? result.railcar : null }
								result={ result }
								resultFormat={ this.props.resultFormat }
								searchQuery={ this.props.searchQuery }
							/>
						) ) }
					</ol>
				) }
				{ hasResults && this.props.hasNextPage && (
					<div className="jetpack-instant-search__search-results-pagination">
						<ScrollButton
							enableLoadOnScroll={ this.props.enableLoadOnScroll }
							isLoading={ this.props.isLoading }
							onLoadNextPage={ this.props.onLoadNextPage }
						/>
					</div>
				) }
			</Fragment>
		);
	}

	renderSecondarySection() {
		return (
			<SearchSidebar
				filters={ this.props.filters }
				staticFilters={ this.props.staticFilters }
				isLoading={ this.props.isLoading }
				locale={ this.props.locale }
				postTypes={ this.props.postTypes }
				response={ this.props.response }
				showPoweredBy={ this.props.showPoweredBy }
				widgets={ this.props.widgets }
				widgetOutsideOverlay={ this.props.widgetOutsideOverlay }
			/>
		);
	}

	closeOverlay = event => {
		event.preventDefault();
		this.props.closeOverlay();
	};

	onKeyPressHandler = event => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			this.props.closeOverlay();
		}
	};

	render() {
		return (
			<div
				aria-hidden={ this.props.isLoading === true }
				className="jetpack-instant-search__search-results"
			>
				<div className="jetpack-instant-search__search-results-controls" role="form">
					<SearchForm
						aria-controls="jetpack-instant-search__search-results-content"
						className="jetpack-instant-search__search-results-search-form"
						isVisible={ this.props.isVisible }
						onChangeSearch={ this.props.onChangeSearch }
						searchQuery={ this.props.searchQuery }
					/>
					<button
						className="jetpack-instant-search__overlay-close"
						onClick={ this.closeOverlay }
						onKeyPress={ this.onKeyPressHandler }
						tabIndex="0"
						aria-label={ __( 'Close search results', 'jetpack-search-pkg' ) }
					>
						<Gridicon icon="cross" size="24" aria-hidden="true" focusable="false" />
					</button>
				</div>

				<SearchControls
					enableSort={ this.props.enableSort }
					onChangeSort={ this.props.onChangeSort }
					resultFormat={ this.props.resultFormat }
					sort={ this.props.sort }
				>
					{ ( this.hasFilterOptions() || this.props.hasNonSearchWidgets ) && (
						<div
							role="button"
							onClick={ this.toggleMobileSecondary }
							onKeyDown={ this.toggleMobileSecondary }
							tabIndex="0"
							className="jetpack-instant-search__search-results-filter-button"
						>
							{ __( 'Filters', 'jetpack-search-pkg' ) }
							<Gridicon
								icon="chevron-down"
								size={ 16 }
								alt={ __( 'Show search filters', 'jetpack-search-pkg' ) }
								aria-hidden="true"
							/>
							<span className="screen-reader-text assistive-text">
								{ this.state.shouldShowMobileSecondary
									? __( 'Hide filters', 'jetpack-search-pkg' )
									: __( 'Show filters', 'jetpack-search-pkg' ) }
							</span>
						</div>
					) }
				</SearchControls>

				<div
					aria-live="polite"
					className="jetpack-instant-search__search-results-content"
					id="jetpack-instant-search__search-results-content"
				>
					<div className="jetpack-instant-search__search-results-primary">
						{ this.renderPrimarySection() }
					</div>
					<div
						className={ [
							'jetpack-instant-search__search-results-secondary',
							`${
								this.state.shouldShowMobileSecondary
									? 'jetpack-instant-search__search-results-secondary--show-as-modal'
									: ''
							} `,
						].join( ' ' ) }
					>
						{ this.renderSecondarySection() }
					</div>
				</div>
			</div>
		);
	}
}

export default SearchResults;
