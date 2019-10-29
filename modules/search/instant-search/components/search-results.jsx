/** @jsx h */

/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import SearchResultMinimal from './search-result-minimal';
import { hasFilter } from '../lib/query-string';
import ScrollButton from './scroll-button';

class SearchResults extends Component {
	renderResult = ( result, index ) => {
		switch ( this.props.resultFormat ) {
			case 'engagement':
			case 'product':
			case 'minimal':
			default:
				return (
					<SearchResultMinimal
						index={ index }
						locale={ this.props.locale }
						query={ this.props.query }
						result={ result }
					/>
				);
		}
	};

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

	renderEmptyResults( { showText = false } = {} ) {
		return (
			<div className="jetpack-instant-search__search-results">
				{ showText ? (
					<div>
						<h3>{ sprintf( __( 'No Results.', 'jetpack' ), this.props.query ) }</h3>
					</div>
				) : null }
			</div>
		);
	}

	render() {
		const { query } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.props.response;
		const hasQuery = query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		if ( ! hasQuery && ! hasFilter() ) {
			return this.renderEmptyResults();
		}
		if ( total === 0 ) {
			return this.renderEmptyResults( { showText: true } );
		}

		return (
			<div
				className={ `jetpack-instant-search__search-results ${
					this.props.isLoading === true ? ' jetpack-instant-search__is-loading' : ''
				}` }
			>
				<p className="jetpack-instant-search__search-results-real-query">
					{ this.getSearchTitle() }
				</p>
				{ hasCorrectedQuery && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ results.map( this.renderResult ) }
				{ this.props.hasNextPage && (
					<ScrollButton
						enableLoadOnScroll={ this.props.enableLoadOnScroll }
						isLoading={ this.props.isLoading }
						onLoadNextPage={ this.props.onLoadNextPage }
					/>
				) }
			</div>
		);
	}
}

export default SearchResults;
