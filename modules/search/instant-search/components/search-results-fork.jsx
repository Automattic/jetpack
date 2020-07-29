/** @jsx h */

/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { h, Component, Fragment } from 'preact';
import { useMemo } from 'preact/hooks';

/**
 * Internal dependencies
 */
import Notice from './notice';
import ScrollButton from './scroll-button';
import SearchResult from './search-result';
import { getConstrastingColor } from '../lib/colors';
import { getSearchResults } from '../../instant-search-gutenberg/store/actions';
import { SERVER_OBJECT_NAME } from '../lib/constants';
import { buildFilterAggregations } from '../lib/api';

class SearchResults extends Component {
	constructor( ...args ) {
		super( ...args );
		this.state = { response: {} };
		this.props.store.subscribe( () => {
			// eslint-disable-next-line no-console
			console.log( 'SearchResults subscription:', this.props.store.getState() );
			this.setState( { response: this.props.store.getState() } );
		} );
	}

	componentDidMount() {
		this.props.store.dispatch(
			getSearchResults( {
				aggregations: buildFilterAggregations( [
					...window[ SERVER_OBJECT_NAME ].widgets,
					...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
				] ),
				query: this.props.query,
				resultFormat: window[ SERVER_OBJECT_NAME ].overlayOptions.resultFormat,
				siteId: window[ SERVER_OBJECT_NAME ].siteId,
			} )
		);
	}

	getSearchTitle() {
		if ( this.state.response === {} ) {
			return sprintf( __( 'No results found', 'jetpack' ), this.props.query );
		}

		const { total = 0, corrected_query = false } = this.state.response;
		const hasQuery = this.props.query !== '';
		const hasCorrectedQuery = corrected_query !== false;
		const num = new Intl.NumberFormat().format( total );

		if ( this.props.isLoading ) {
			return sprintf( __( 'Searching…', 'jetpack' ), this.props.query );
		}
		if ( total === 0 || this.props.hasError ) {
			return sprintf( __( 'No results found', 'jetpack' ), this.props.query );
		}
		if ( hasQuery && hasCorrectedQuery ) {
			return sprintf(
				_n( 'Found %s result for "%s"', 'Found %s results for "%s"', total, 'jetpack' ),
				num,
				corrected_query
			);
		} else if ( hasQuery ) {
			return sprintf(
				_n( 'Found %s result for "%s"', 'Found %s results for "%s"', total, 'jetpack' ),
				num,
				this.props.query
			);
		}
		return sprintf( _n( 'Found %s result', 'Found %s results', total, 'jetpack' ), num );
	}

	renderPrimarySection() {
		if ( this.state.response === {} ) {
			return null;
		}
		const { highlightColor, query } = this.props;
		const { results = [], total = 0, corrected_query = false } = this.state.response;
		const textColor = useMemo( () => getConstrastingColor( highlightColor ), [ highlightColor ] );
		const hasCorrectedQuery = corrected_query !== false;
		const hasResults = total > 0;

		return (
			<Fragment>
				<style
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={ {
						__html: `
							.jetpack-instant-search__search-results .jetpack-instant-search__search-results-primary mark { 
								color: ${ textColor };
								background-color: ${ highlightColor };
							}
						`,
					} }
				/>

				<div className="jetpack-instant-search__search-results-title">
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
				{ hasResults && ! this.props.hasError && this.state.response._isOffline && (
					<Notice type="warning">
						{ __(
							"It looks like you're offline. Please reconnect to load the latest results.",
							'jetpack'
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

	render() {
		return (
			<main
				aria-hidden={ this.props.isLoading === true }
				aria-live="polite"
				className="jetpack-instant-search__search-results"
			>
				{ this.renderPrimarySection() }
			</main>
		);
	}
}

export default SearchResults;
