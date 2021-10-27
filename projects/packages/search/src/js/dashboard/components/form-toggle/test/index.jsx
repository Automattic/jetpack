/**
 * External dependencies
 */
import assert from 'assert';
import React from 'react';
import ReactDOM, { TestUtils } from 'react-dom';
import { unique } from 'lodash';

/**
 * Internal dependencies
 */
import CompactFormToggle from 'components/form-toggle/compact';

describe( 'CompactFormToggle', function () {
	describe( 'rendering', function () {
		it( 'should have is-compact class', function () {
			const toggle = TestUtils.renderIntoDocument( <CompactFormToggle /> ),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle' );

			assert( 0 < toggleInput.length, 'a form toggle was rendered' );
			assert(
				toggleInput[ 0 ].getDOMNode().className.indexOf( 'is-compact' ) >= 0,
				'is-compact class exists'
			);
		} );
	} );
} );

describe( 'FormToggle', function () {
	afterEach( function () {
		ReactDOM.unmountComponentAtNode( document.body );
	} );

	describe( 'rendering', function () {
		it( 'should have form-toggle class', function () {
			const toggle = TestUtils.renderIntoDocument( <CompactFormToggle /> ),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle' );

			assert( 0 < toggleInput.length, 'a form toggle was rendered' );
		} );

		it( 'should not have is-compact class', function () {
			const toggle = TestUtils.renderIntoDocument( <CompactFormToggle /> ),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'is-compact' );

			assert( 0 === toggleInput.length, 'no form toggle with is-compact class' );
		} );

		it( 'should be checked when checked is true', function () {
			[ true, false ].forEach( function ( bool ) {
				const toggle = TestUtils.renderIntoDocument( <CompactFormToggle checked={ bool } /> ),
					toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle' );

				assert( 0 < toggleInput.length, 'a form toggle was rendered' );
				assert(
					bool === toggleInput[ 0 ].getDOMNode().checked,
					'form toggle checked equals boolean'
				);
			} );
		} );

		it( 'should not be disabled when disabled is false', function () {
			const toggle = TestUtils.renderIntoDocument(
					<CompactFormToggle checked={ false } disabled={ false } />
				),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle' );

			assert( 0 < toggleInput.length, 'a form toggle was rendered' );
			assert(
				false === toggleInput[ 0 ].getDOMNode().disabled,
				'form toggle disabled equals boolean'
			);
		} );

		it( 'should be disabled when disabled is true', function () {
			const toggle = TestUtils.renderIntoDocument(
					<CompactFormToggle checked={ false } disabled={ true } />
				),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle' );

			assert( 0 < toggleInput.length, 'a form toggle was rendered' );
			assert(
				true === toggleInput[ 0 ].getDOMNode().disabled,
				'form toggle disabled equals boolean'
			);
		} );

		it( 'should have a label whose htmlFor matches the checkbox id', function () {
			const toggle = TestUtils.renderIntoDocument( <CompactFormToggle checked={ false } /> ),
				toggleInput = TestUtils.scryRenderedDOMComponentsWithClass( toggle, 'form-toggle__switch' ),
				toggleLabel = TestUtils.scryRenderedDOMComponentsWithTag( toggle, 'label' );

			assert( toggleInput[ 0 ].getDOMNode().id === toggleLabel[ 0 ].getDOMNode().htmlFor );
		} );

		it( 'should create unique ids for each toggle', function () {
			const toggles = TestUtils.renderIntoDocument(
					<div>
						<CompactFormToggle checked={ false } />
						<CompactFormToggle checked={ false } />
						<CompactFormToggle checked={ false } />
					</div>
				),
				toggleInputs = TestUtils.scryRenderedDOMComponentsWithClass( toggles, 'form-toggle' ),
				ids = toggleInputs.map( function ( input ) {
					return input.getDOMNode().id;
				} );

			return ids.length === unique( ids ).length;
		} );
	} );
} );
