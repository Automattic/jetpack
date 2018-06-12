/**
 * External dependencies
 */
const React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' );

const createReactClass = require( 'create-react-class' );

/**
 * Internal dependencies
 */
const Search = require( 'components/search' ),
	SearchCard = require( 'components/search-card' );

/**
 * Globals
 */
const noop = () => {};

const SearchDemo = createReactClass( {
	displayName: 'Search',

	mixins: [ PureRenderMixin ],

	render: function() {
		return (
			<div className="design-assets__group">
				<h2>
					<a href="/devdocs/design/search">Search</a>
				</h2>
				<Search
					onSearch={ noop }
					placeholder="Placeholder text..."
				/>
				<h2>Search Card</h2>
				<SearchCard
					onSearch={ noop }
					placeholder="Placeholder text..."
				/>
			</div>
		);
	}
} );

module.exports = SearchDemo;
