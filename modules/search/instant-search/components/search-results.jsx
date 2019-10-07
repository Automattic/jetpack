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
		const { results = [], query, total = 0, corrected_query = false } = this.props;

		if ( query === '' ) {
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
					{ corrected_query !== false
						? sprintf(
								_n( 'Showing %s result for "%s"', 'Showing %s results for "%s"', total ),
								num,
								corrected_query
						  )
						: sprintf( _n( '%s results for "%s"', '%s results for "%s"', total ), num, query ) }
				</p>
				{ corrected_query !== false && (
					<p className="jetpack-instant-search__search-results-unused-query">
						{ sprintf( __( 'No results for "%s"', 'jetpack' ), query ) }
					</p>
				) }
				{ results.map( result => this.render_result( result ) ) }
				{ this.props.hasNextPage && (
					<ScrollButton onClick={ this.props.onLoadNextPage } isLoading={ this.props.isLoading } />
				) }
			</div>
		);
	}
}

export default SearchResults;
