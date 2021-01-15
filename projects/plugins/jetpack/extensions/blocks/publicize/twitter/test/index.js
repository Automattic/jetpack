/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TwitterThreadListener from '..';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );

describe( 'TwitterThreadListener', () => {
	it( 'should expose the listener component', () => {
		expect( TwitterThreadListener ).toBeDefined();
	} );

	it( 'should not add any classes when threading is disabled', () => {
		useSelect.mockImplementation( () => {
			return {
				isTweetStorm: false,
				isTyping: false,
			};
		} );

		mount( <TwitterThreadListener /> );

		expect( global.document.body.classList ).not.toContain( 'jetpack-tweetstorm' );
		expect( global.document.body.classList ).not.toContain( 'jetpack-tweetstorm-is-typing' );
	} );

	it( 'should still not add any classes when threading is disabled', () => {
		useSelect.mockImplementation( () => {
			return {
				isTweetStorm: false,
				isTyping: true,
			};
		} );

		mount( <TwitterThreadListener /> );

		expect( global.document.body.classList ).not.toContain( 'jetpack-tweetstorm' );
		expect( global.document.body.classList ).not.toContain( 'jetpack-tweetstorm-is-typing' );
	} );

	it( 'should add the main class when threading is enabled', () => {
		useSelect.mockImplementation( () => {
			return {
				isTweetStorm: true,
				isTyping: false,
			};
		} );

		mount( <TwitterThreadListener /> );

		expect( global.document.body.classList ).toContain( 'jetpack-tweetstorm' );
		expect( global.document.body.classList ).not.toContain( 'jetpack-tweetstorm-is-typing' );
	} );

	it( 'should add the main class and typing class when threading is enabled and user is typing', () => {
		useSelect.mockImplementation( () => {
			return {
				isTweetStorm: true,
				isTyping: true,
			};
		} );

		mount( <TwitterThreadListener /> );

		expect( global.document.body.classList ).toContain( 'jetpack-tweetstorm' );
		expect( global.document.body.classList ).toContain( 'jetpack-tweetstorm-is-typing' );
	} );
} );
