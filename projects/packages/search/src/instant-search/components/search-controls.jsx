/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import SearchSort from './search-sort';
import './search-controls.scss';

const SearchControls = props => {
	return (
		<div className="jetpack-instant-search__search-form-controls" role="form">
			{ props.children }
			{ props.enableSort && (
				<SearchSort
					onChange={ props.onChangeSort }
					resultFormat={ props.resultFormat }
					value={ props.sort }
				/>
			) }
		</div>
	);
};
export default SearchControls;
