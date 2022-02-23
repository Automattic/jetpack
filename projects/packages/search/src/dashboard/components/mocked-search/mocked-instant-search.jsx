/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
// TODO change to our own gridicon component, when instant search is migrated.
import Gridicon from 'gridicons';
import TextRowPlaceHolder from './placeholder';
import './mocked-instant-search.scss';

/**
 * Generate mocked instant search dialog
 *
 * @returns {React.Component}	Mocked Search instant dialog component.
 */
export default function MockedInstantSearch() {
	const renderFilterOption = ( val, key ) => (
		<div className="jp-mocked-instant-search__search-filter" key={ key }>
			<label>
				<input type="checkbox" disabled="disabled" />{ ' ' }
				<TextRowPlaceHolder style={ { width: '30%' } } />
			</label>
		</div>
	);

	const renderSearchResult = ( val, key ) => (
		<div className="jp-mocked-instant-search__search-result" key={ key }>
			<TextRowPlaceHolder
				style={ {
					height: '2.5em',
					width: '50%',
					maxWidth: '200px',
					margin: '0.1em 0.1em 1em 0.1em',
				} }
			/>
			<TextRowPlaceHolder style={ { height: '1em', width: '90%', margin: '0.1em' } } />
			<TextRowPlaceHolder style={ { height: '1em', width: '70%', margin: '0.1em' } } />
		</div>
	);

	return (
		<div className="jp-mocked-instant-search" aria-hidden="true">
			<div className="jp-mocked-instant-search__search-controls">
				<div className="jp-mocked-instant-search__search-icon">
					<Gridicon icon="search" size={ 24 } />
				</div>
				<div className="jp-mocked-instant-search__search-mock-input">
					<TextRowPlaceHolder style={ { height: '50px', width: '80%', maxWidth: '212px' } } />
				</div>
				<div className="jp-mocked-instant-search__close-button">
					<Gridicon icon="cross" size={ 24 } />
				</div>
			</div>
			<div className="jp-mocked-instant-search__search-results">
				<div className="jp-mocked-instant-search__search-results-primary">
					<div className="jp-mocked-instant-search__search-results-header">
						<div className="jp-mocked-instant-search__result-statistics">
							{
								/* translators: %s is replaced with the number of search results */
								sprintf( __( 'Found %s results', 'jetpack-search-pkg' ), '27' )
							}
						</div>
						<div className="jp-mocked-instant-search__result-sort-list">
							<span className="jp-mocked-instant-search__result-sort-selected">
								{ __( 'Relevance', 'jetpack-search-pkg' ) }
							</span>
							<span>&middot;</span>
							<span>{ __( 'Newest', 'jetpack-search-pkg' ) }</span>
							<span>&middot;</span>
							<span>{ __( 'Oldest', 'jetpack-search-pkg' ) }</span>
						</div>
					</div>
					<div className="jp-mocked-instant-search__search-results-content">
						{ Array.apply( null, Array( 3 ) ).map( renderSearchResult ) }
					</div>
				</div>
				<div className="jp-mocked-instant-search__search-results-secondary">
					<div className="jp-mocked-instant-search__search-filter-header">
						{ __( 'Filter options', 'jetpack-search-pkg' ) }
					</div>
					<div className="jp-mocked-instant-search__search-filter-list">
						{ Array.apply( null, Array( 2 ) ).map( renderFilterOption ) }
					</div>
				</div>
			</div>
		</div>
	);
}
