/**
 * External dependencies
 */
import React from 'react';

import PureRenderMixin from 'react-pure-render/mixin';
import createReactClass from 'create-react-class';

/**
 * Internal dependencies
 */
import Search from 'components/search';

import SearchCard from 'components/search-card';

/**
 * Globals
 */
const noop = () => {};

const SearchDemo = createReactClass( {
	displayName: 'Search',

	mixins: [ PureRenderMixin ],

	render: function () {
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
	},
} );

export default SearchDemo;
