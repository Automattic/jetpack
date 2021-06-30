/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import Gridicon from '../../../../modules/search/instant-search/components/gridicon';
import TextRowPlaceHolder from './placeholder';
import './mocked-instant-search.scss';

/**
 * Generate mocked search dialog
 *
 * @returns {React.Component}	Mocked Search dialog component.
 */
export default function MockedInstantSearch() {
	const renderFilterOption = label => (
		<div className="jp-mocked-instant-search__search-filter">
			<label>
				<input type="checkbox" disabled="disabled" />{ ' ' }
				<TextRowPlaceHolder style={ { width: '30%' } } />
			</label>
		</div>
	);
	const renderSearchResult = () => (
		<div className="jp-mocked-instant-search__search-result">
			<TextRowPlaceHolder
				style={ { height: '2.5em', width: '50%', margin: '0.1em 0.1em 1em 0.1em' } }
			/>
			<TextRowPlaceHolder style={ { height: '1em', width: '90%', margin: '0.1em' } } />
			<TextRowPlaceHolder style={ { height: '1em', width: '70%', margin: '0.1em' } } />
		</div>
	);
	return (
		<div className="jp-mocked-instant-search">
			<div className="jp-mocked-instant-search__search-controls">
				<div className="jp-mocked-instant-search__search-icon">
					<Gridicon icon="search" size={ 24 } />
				</div>
				<div className="jp-mocked-instant-search__search-mock-input">
					<TextRowPlaceHolder style={ { height: '50px', width: '80%' } } />
				</div>
				<div className="jp-mocked-instant-search__close-button">
					<Gridicon icon="cross" size="24" aria-hidden="true" focusable="false" />
				</div>
			</div>
			<div className="jp-mocked-instant-search__search-results">
				<div className="jp-mocked-instant-search__search-results-primary">
					<div className="jp-mocked-instant-search__search-results-header">
						<div className="jp-mocked-instant-search__result-statistics">
							{ __( 'Found 27 results', 'jetpack' ) }
						</div>
						<div className="jp-mocked-instant-search__result-sort-list">
							<span className="jp-mocked-instant-search__result-sort-selected">
								{ __( 'Relevance', 'jetpack' ) }
							</span>
							<span>&middot;</span>
							<span>{ __( 'Newest', 'jetpack' ) }</span>
							<span>&middot;</span>
							<span>{ __( 'Oldest', 'jetpack' ) }</span>
						</div>
					</div>
					<div className="jp-mocked-instant-search__search-results-content">
						{ Array.apply( null, Array( 3 ) ).map( renderSearchResult ) }
					</div>
				</div>
				<div className="jp-mocked-instant-search__search-results-secondary">
					<div className="jp-mocked-instant-search__search-filter-header">Filter Options</div>
					<div className="jp-mocked-instant-search__search-filter-list">
						{ Array.apply( null, Array( 2 ) ).map( renderFilterOption ) }
					</div>
				</div>
			</div>
		</div>
	);
}
