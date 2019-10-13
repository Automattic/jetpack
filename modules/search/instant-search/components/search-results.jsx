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
	render_result( result ) {
		switch ( this.props.resultFormat ) {
			case 'engagement':
			case 'product':
			case 'minimal':
			default:
				return <SearchResultMinimal result={ result } />;
		}
	}

	render() {
		const { query } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.props.response;
		const hasQuery = query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		if ( ! hasQuery && ! hasFilter() ) {
			return <div className="jetpack-instant-search__search-results" />;
		}
		if ( total === 0 ) {
			return (
				<div className="jetpack-instant-search__search-results">
					<div>
						<h3>{ sprintf( __( 'No Results.', 'jetpack' ), query ) }</h3>
					</div>
				</div>
			);
		}
		const num = new Intl.NumberFormat().format( total );

		let headerText = sprintf( _n( '%s result', '%s results', total ), num );
		if ( hasQuery ) {
			if ( hasCorrectedQuery ) {
				headerText = sprintf(
					_n( 'Showing %s result for "%s"', 'Showing %s results for "%s"', total ),
					num,
					corrected_query
				);
			} else {
				headerText = sprintf(
					_n( '%s result for "%s"', '%s results for "%s"', total ),
					num,
					query
				);
			}
		}

		return (
			<div
				className={ `jetpack-instant-search__search-results ${
					this.state.isLoading === true ? ' jetpack-instant-search__is-loading' : ''
				}` }
			>
				<p className="jetpack-instant-search__search-results-real-query">{ headerText }</p>
				{ hasCorrectedQuery && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ results.map( result => this.render_result( result ) ) }
				{ this.props.hasNextPage && (
					<ScrollButton
						enableLoadOnScroll
						isLoading={ this.props.isLoading }
						onLoadNextPage={ this.props.onLoadNextPage }
					/>
				) }
			</div>
		);
	}
}

export default SearchResults;
