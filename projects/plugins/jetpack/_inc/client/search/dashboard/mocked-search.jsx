/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from '../../../../modules/search/instant-search/components/gridicon';
import TextRowPlaceHolder from './placeholder';
import './mocked-search.scss';

/**
 * Generate mocked search dialog
 *
 * @returns {React.Component}	Mocked Search dialog component.
 */
export default function MockedSearch() {
	return (
		<div className="jp-search-dashboard-mocked-search__legacy-search-container">
			<div className="jp-search-dashboard-mocked-search__search-controls">
				<div className="jp-search-dashboard-mocked-search__search-icon">
					<Gridicon icon="search" size={ 24 } />
				</div>
				<div className="jp-search-dashboard-mocked-search__search-mock-input">
					<TextRowPlaceHolder style={ { height: '50px', width: '80%' } } />
				</div>
			</div>
		</div>
	);
}
