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
		const { results = [], query, total = 0, corrected_query = false, loading = false } = this.props;
		const hasQuery = query !== '';
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
		const cls =
			loading === true
				? 'jetpack-instant-search__search-results jetpack-instant-search__is-loading'
				: 'jetpack-instant-search__search-results';

		return (
			<div className={ cls }>
				<p className="jetpack-instant-search__search-results-real-query">
					{ hasQuery
						? corrected_query !== false
							? sprintf(
									_n( 'Showing %s result for "%s"', 'Showing %s results for "%s"', total ),
									num,
									corrected_query
							  )
							: sprintf( _n( '%s result for "%s"', '%s results for "%s"', total ), num, query )
						: //only filtering, no search query
						  sprintf( _n( '%s result', '%s results', total ), num ) }
				</p>
				{ corrected_query !== false && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ results.map( result => this.render_result( result ) ) }
			</div>
		);
	}
}

export default SearchResults;
