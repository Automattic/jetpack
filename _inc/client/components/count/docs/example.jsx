/**
 * External dependencies
 */
const React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' );

const createReactClass = require( 'create-react-class' );

/**
 * Internal dependencies
 */
const Count = require( 'components/count' );

module.exports = createReactClass( {
	displayName: 'Count',

	mixins: [ PureRenderMixin ],

	render: function() {
		return (
			<div className="design-assets__group">
				<h2>
					<a href="/devdocs/design/count">Count</a>
				</h2>
				<div>
					<Count count={ 65365 } />
				</div>
			</div>
		);
	},
} );
