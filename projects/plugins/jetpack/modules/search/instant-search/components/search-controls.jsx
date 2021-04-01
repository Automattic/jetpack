/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';

/**
 * Internal dependencies
 */
import SearchSort from './search-sort';
import './search-controls.scss';

const SearchControls = props => {
	return (
		<div className="jetpack-instant-search__search-form-controls">
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
