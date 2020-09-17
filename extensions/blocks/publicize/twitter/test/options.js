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
import PublicizeTwitterOptions from '../options';

// Override useSelect(), so we can return mock state data.
jest.mock( '@wordpress/data/build/components/use-select/', () => jest.fn() );

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
} );
