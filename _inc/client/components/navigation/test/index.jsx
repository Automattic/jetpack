/**
 * External dependencies
 */
var assert = require( 'chai' ).assert,
	React = require( 'react' ),
	TestUtils = require( 'react-addons-test-utils' ),
	mockery = require( 'mockery' );

function mockComponent( displayName ) {
	return React.createClass( {
		displayName,
		render: () => {
			return <div/>
		}
	} );
};

describe( 'Navigation', function() {
	before( function() {
		mockery.registerMock( 'components/tabs', mockComponent() );
		mockery.registerMock( 'components/card', mockComponent() );

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		this.Navigation = require( '../' );
	} );

	describe( 'rendering', function() {
		beforeEach( function() {
			var shallowRenderer = TestUtils.createRenderer();

			shallowRenderer.render( React.createElement( this.Navigation, {} ) );
			this.navigationElement = shallowRenderer.getRenderOutput();
		} );

		it( 'should render a div with a className of "dops-navigation"', function() {
			assert( this.navigationElement, 'element does not exist' );
			assert( this.navigationElement.props.className === 'dops-navigation', 'className does not equal "dops-navigation"' );
		} );
	} );
} );
