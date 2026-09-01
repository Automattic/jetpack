import { PureComponent } from 'react';
import Search from 'components/search';

/**
 * Globals
 */
const noop = () => {};

class SearchDemo extends PureComponent {
	static displayName = 'Search';

	render() {
		return (
			<div className="design-assets__group">
				<h2>
					<a href="/devdocs/design/search">Search</a>
				</h2>
				<Search onSearch={ noop } placeholder="Placeholder text..." />
			</div>
		);
	}
}

export default SearchDemo;
