/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';
import TextRowPlaceHolder from './placeholder';
import './mocked-legacy-search.scss';

/**
 * Generate mocked search dialog
 *
 * @returns {React.Component}	Mocked Search dialog component.
 */
export default function MockedLegacySearch() {
	return (
		<div className="jp-mocked-legacy-search">
			<div className="jp-mocked-legacy-search__search-controls">
				<div className="jp-mocked-legacy-search__search-icon">
					<Gridicon icon="search" size={ 24 } />
				</div>
				<div className="jp-mocked-legacy-search__search-input">
					<TextRowPlaceHolder style={ { height: '50px', width: '80%' } } />
				</div>
			</div>
		</div>
	);
}
