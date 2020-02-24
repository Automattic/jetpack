/** @jsx h */

/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { h, Component, Fragment } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import Notice from './notice';
import ScrollButton from './scroll-button';
import SearchForm from './search-form';
import SearchResult from './search-result';
import SearchSidebar from './search-sidebar';

class SearchResults extends Component {
	getSearchTitle() {
		const { total = 0, corrected_query = false } = this.props.response;
		const hasQuery = this.props.query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		const num = new Intl.NumberFormat().format( total );

		if ( total === 0 || this.props.hasError ) {
			return sprintf( __( 'No results for "%s".', 'jetpack' ), this.props.query );
		}
		if ( hasQuery && hasCorrectedQuery ) {
			return sprintf(
				_n( 'Showing %s result for "%s"', 'Showing %s results for "%s"', total, 'jetpack' ),
				num,
				corrected_query
			);
		} else if ( hasQuery ) {
			return sprintf(
				_n( '%s result for "%s"', '%s results for "%s"', total, 'jetpack' ),
				num,
				this.props.query
			);
		}
		return sprintf( _n( '%s result', '%s results', total, 'jetpack' ), num );
	}

	renderPrimarySection() {
		const { query } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.props.response;
		const hasCorrectedQuery = corrected_query !== false;
		const hasResults = total > 0;

		return (
			<Fragment>
				<style
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: `
							.jetpack-instant-search__search-results .jetpack-instant-search__search-results-primary mark { 
								background-color: ${ this.props.highlightColor };
							}
						`,
					} }
				/>
				<SearchForm
					className="jetpack-instant-search__search-results-search-form"
					isLoading={ this.props.isLoading }
					locale={ this.props.locale }
					postTypes={ this.props.postTypes }
					response={ this.props.response }
					widgets={ this.props.widgets }
				/>

				<div
					className={
						hasResults
							? 'jetpack-instant-search__search-results-real-query'
							: 'jetpack-instant-search__search-results-empty'
					}
				>
					{ this.getSearchTitle() }
				</div>

				{ hasResults && hasCorrectedQuery && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ this.props.hasError && (
					<Notice type="warning">
						{ __( "It looks like you're offline. Please reconnect for results.", 'jetpack' ) }
					</Notice>
				) }
				{ hasResults && ! this.props.hasError && this.props.response._isOffline && (
					<Notice type="warning">
						{ __(
							"It looks like you're offline. Please reconnect to load the latest results.",
							'jetpack'
						) }
					</Notice>
				) }
				{ hasResults && ! this.props.hasError && (
					<ol
						className={ `jetpack-instant-search__search-results-list is-format-${
							this.props.resultFormat
						}${ this.props.isLoading === true ? ' jetpack-instant-search__is-loading' : '' }` }
					>
						{ results.map( ( result, index ) => (
							<SearchResult
								index={ index }
								locale={ this.props.locale }
								query={ this.props.query }
								railcar={ this.props.isVisible ? result.railcar : null }
								result={ result }
								resultFormat={ this.props.resultFormat }
							/>
						) ) }
					</ol>
				) }
				{ hasResults && this.props.hasNextPage && (
					<div className="jetpack-instant-search__search-pagination">
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
				isLoading={ this.props.isLoading }
				locale={ this.props.locale }
				postTypes={ this.props.postTypes }
				response={ this.props.response }
				showPoweredBy={ this.props.showPoweredBy }
				widgets={ this.props.widgets }
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
			<main
				aria-hidden={ this.props.isLoading === true }
				aria-live="polite"
				className={ `jetpack-instant-search__search-results ${
					this.props.isLoading === true ? ' jetpack-instant-search__is-loading' : ''
				}` }
			>
				<a
					className="jetpack-instant-search__overlay-close"
					onClick={ this.closeOverlay }
					onKeyPress={ this.onKeyPressHandler }
					role="button"
					tabIndex="0"
				>
					<Gridicon icon="cross" size="24" />
				</a>
				<div className="jetpack-instant-search__search-results-primary">
					{ this.renderPrimarySection() }
				</div>
				<div className="jetpack-instant-search__search-results-secondary">
					{ this.renderSecondarySection() }
				</div>
			</main>
		);
	}
}

export default SearchResults;
