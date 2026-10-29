import * as React from 'react';
import SearchSort from './search-sort';
import './search-controls.scss';

const SearchControls = props => {
	return (
		<div className="jetpack-instant-search__search-form-controls" role="form">
			{ props.enableSort && (
				<SearchSort
					onChange={ props.onChangeSort }
					resultFormat={ props.resultFormat }
					value={ props.sort }
				/>
			) }
			{ props.children }
		</div>
	);
};
export default SearchControls;
