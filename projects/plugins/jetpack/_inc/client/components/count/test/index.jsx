/**
 * External dependencies
 */
import { expect } from 'chai';

import useMockery from 'test/helpers/use-mockery';

/**
 * Internal dependencies
 */
import useI18n from 'test/helpers/use-i18n';

describe( 'Count', function () {
	let React, ReactInjection, TestUtils, Count, renderer;

	// really only using Mockery for the clean module cache
	useMockery();
	useI18n();

	before( function () {
		React = require( 'react' );
		ReactInjection = require( 'react/lib/ReactInjection' );
		TestUtils = require( 'react-addons-test-utils' );

		ReactInjection.Class.injectMixin( require( 'lib/mixins/i18n' ).mixin );
		Count = require( '../' );
	} );

	beforeEach( function () {
		renderer = TestUtils.createRenderer();
	} );

	it( 'should render the passed count', function () {
		renderer.render( <Count count={ 23 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.className ).to.equal( 'count' );
		expect( result.props.children ).to.equal( '23' );
	} );

	it( 'should use the correct class name', function () {
		renderer.render( <Count count={ 23 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.className ).to.equal( 'count' );
	} );

	it( 'should internationalize the passed count', function () {
		renderer.render( <Count count={ 2317 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.children ).to.equal( '2,317' );
	} );

	it( 'should render zero', function () {
		renderer.render( <Count count={ 0 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.children ).to.equal( '0' );
	} );

	it( 'should render negative numbers', function () {
		renderer.render( <Count count={ -1000 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.children ).to.equal( '-1,000' );
	} );

	it( 'should cut off floating point numbers', function () {
		renderer.render( <Count count={ 3.1415926 } /> );
		const result = renderer.getRenderOutput();

		expect( result.props.children ).to.equal( '3' );
	} );
} );
