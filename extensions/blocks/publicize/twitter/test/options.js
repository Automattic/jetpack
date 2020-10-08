/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { mount } from 'enzyme';
import { useSelect, __unstableUseDispatchWithMap } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublicizeTwitterOptions from '../options';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/build/components/use-dispatch/use-dispatch-with-map', () => jest.fn() );

describe( 'PublicizeTwitterOptions', () => {
	it( 'should expose the options component', () => {
		expect( PublicizeTwitterOptions ).toBeDefined();
	} );

	it( 'should not render with no twitter connections', () => {
		useSelect.mockImplementation( () => {
			return {
				connections: [ { service_name: 'facebook' }, { service_name: 'instagram' } ],
			}
		} );
		const wrapper = mount( <PublicizeTwitterOptions /> );

		expect( wrapper.find( 'h3' ) ).toHaveLength( 0 );
		expect( wrapper.find( 'input' ) ).toHaveLength( 0 );
	} );

	it( 'should render with a twitter connection', () => {
		useSelect.mockImplementation( () => {
			return {
				connections: [ { service_name: 'twitter' } ],
			}
		} );
		const wrapper = mount( <PublicizeTwitterOptions /> );

		expect( wrapper.find( 'h3' ) ).toHaveLength( 1 );
		expect( wrapper.find( 'input' ) ).toHaveLength( 2 );
		expect( wrapper.find( 'input' ).at( 0 ).props().checked ).toBeTruthy();
		expect( wrapper.find( 'input' ).at( 1 ).props().checked ).toBeFalsy();
	} );

	it( 'should show the tweetstorm option selected when the isTweetStorm prop is set', () => {
		useSelect.mockImplementation( () => {
			return {
				connections: [ { service_name: 'twitter' } ],
				isTweetStorm: true,
			}
		} );
		const wrapper = mount( <PublicizeTwitterOptions /> );

		expect( wrapper.find( 'input' ).at( 0 ).props().checked ).toBeFalsy();
		expect( wrapper.find( 'input' ).at( 1 ).props().checked ).toBeTruthy();
	} );

	it( 'should trigger change event when the selected option changes', () => {
		useSelect.mockImplementation( () => {
			return {
				connections: [ { service_name: 'twitter' } ],
				isTweetStorm: false,
			}
		} );

		const mockSetTweetstorm = jest.fn();
		__unstableUseDispatchWithMap.mockImplementation( () => {
			return {
				setTweetstorm: mockSetTweetstorm,
			};
		} );

		const wrapper = mount( <PublicizeTwitterOptions /> );

		wrapper.find( 'input' ).at( 0 ).simulate( 'change' );

		expect( mockSetTweetstorm ).toHaveBeenCalledTimes( 1 );
		expect( mockSetTweetstorm ).toHaveBeenCalledWith( false );

		mockSetTweetstorm.mockClear();

		wrapper.find( 'input' ).at( 1 ).simulate( 'change' );

		expect( mockSetTweetstorm ).toHaveBeenCalledTimes( 1 );
		expect( mockSetTweetstorm ).toHaveBeenCalledWith( true );
	} );
} );
