import Search from 'components/search';
import SearchCard from 'components/search-card';
import React from 'react';

/**
 * Globals
 */
const noop = () => {};

class SearchDemo extends React.PureComponent {
	static displayName = 'Search';

	render() {
		return (
			<div className="design-assets__group">
				<h2>
					<a href="/devdocs/design/search">Search</a>
				</h2>
				<Search onSearch={ noop } placeholder="Placeholder text..." />
				<h2>Search Card</h2>
				<SearchCard onSearch={ noop } placeholder="Placeholder text..." />
			</div>
		);
	}
}

export default SearchDemo;
