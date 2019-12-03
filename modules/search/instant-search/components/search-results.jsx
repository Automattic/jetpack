/** @jsx h */

/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResult from './search-result';
import { hasFilter } from '../lib/query-string';
import ScrollButton from './scroll-button';
import SearchForm from './search-form';
import SearchResultsEmpty from './search-results-empty';

class SearchResults extends Component {
	getSearchTitle() {
		const { total = 0, corrected_query = false } = this.props.response;
		const hasQuery = this.props.query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		const num = new Intl.NumberFormat().format( total );

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

	render() {
		const { query } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.props.response;
		const hasQuery = query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		const hasResults = total > 0;

		if ( ! hasQuery && ! hasFilter() ) {
			return null;
		}

		return (
			<main
				aria-hidden={ this.props.isLoading === true }
				aria-live="polite"
				className={ `jetpack-instant-search__search-results ${
					this.props.isLoading === true ? ' jetpack-instant-search__is-loading' : ''
				}` }
			>
				<SearchForm className="jetpack-instant-search__search-results-search-form" />

				{ hasResults && (
					<p className="jetpack-instant-search__search-results-real-query">
						{ this.getSearchTitle() }
					</p>
				) }
				{ hasResults && hasCorrectedQuery && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ hasResults && (
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
								result={ result }
								resultFormat={ this.props.resultFormat }
							/>
						) ) }
					</ol>
				) }
				{ ! hasResults && <SearchResultsEmpty query={ this.props.query } /> }
				{ hasResults && this.props.hasNextPage && (
					<div className="jetpack-instant-search__search-pagination">
						{ this.props.hasNextPage && (
							<ScrollButton
								enableLoadOnScroll={ this.props.enableLoadOnScroll }
								isLoading={ this.props.isLoading }
								onLoadNextPage={ this.props.onLoadNextPage }
							/>
						) }
					</div>
				) }
			</main>
		);
	}
}

export default SearchResults;
