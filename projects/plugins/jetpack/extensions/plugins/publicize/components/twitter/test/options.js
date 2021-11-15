/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { mount } from 'enzyme';

/**
 * Internal dependencies
 */
import { PublicizeTwitterOptions } from '../options';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/build/components/use-dispatch/use-dispatch-with-map', () => jest.fn() );
const setTweetstorm = jest.fn();

describe( 'PublicizeTwitterOptions', () => {
	it( 'should expose the options component', () => {
		expect( PublicizeTwitterOptions ).toBeDefined();
	} );

	it( 'should not render with no twitter connections', () => {
		const connections = [ { service_name: 'facebook' }, { service_name: 'instagram' } ];
		const wrapper = mount( <PublicizeTwitterOptions connections={ connections } /> );

		expect( wrapper.find( 'label' ) ).toHaveLength( 0 );
		expect( wrapper.find( 'input' ) ).toHaveLength( 0 );
	} );

	it( 'should not render with only disabled twitter connections', () => {
		const connections = [ { service_name: 'twitter', enabled: false } ];
		const wrapper = mount( <PublicizeTwitterOptions connections={ connections } /> );

		expect( wrapper.find( 'label' ) ).toHaveLength( 0 );
		expect( wrapper.find( 'input' ) ).toHaveLength( 0 );
	} );

	it( 'should render with a twitter connection', () => {
		const connections = [ { service_name: 'twitter', enabled: true } ];
		const wrapper = mount( <PublicizeTwitterOptions connections={ connections } /> );

		expect( wrapper.find( 'label' ) ).toHaveLength( 3 );
		expect( wrapper.find( 'input' ) ).toHaveLength( 2 );
		expect( wrapper.find( 'input' ).at( 0 ).props().checked ).toBeTruthy();
		expect( wrapper.find( 'input' ).at( 1 ).props().checked ).toBeFalsy();
	} );

	it( 'should show the tweetstorm option selected when the isTweetStorm prop is set', () => {
		const connections = [ { service_name: 'twitter', enabled: true } ];
		const isTweetStorm = true;

		const wrapper = mount(
			<PublicizeTwitterOptions connections={ connections } isTweetStorm={ isTweetStorm } />
		);

		expect( wrapper.find( 'input' ).at( 0 ).props().checked ).toBeFalsy();
		expect( wrapper.find( 'input' ).at( 1 ).props().checked ).toBeTruthy();
	} );

	it( 'should trigger change event when the selected option changes', () => {
		const connections = [ { service_name: 'twitter', enabled: true } ];
		const isTweetStorm = false;

		const wrapper = mount(
			<PublicizeTwitterOptions
				connections={ connections }
				setTweetstorm={ setTweetstorm }
				isTweetStorm={ isTweetStorm }
			/>
		);

		wrapper.find( 'input' ).at( 0 ).simulate( 'change' );

		expect( setTweetstorm ).toHaveBeenCalledTimes( 1 );
		expect( setTweetstorm ).toHaveBeenCalledWith( false );

		setTweetstorm.mockClear();

		wrapper.find( 'input' ).at( 1 ).simulate( 'change' );
		expect( setTweetstorm ).toHaveBeenCalledTimes( 1 );
		expect( setTweetstorm ).toHaveBeenCalledWith( true );
	} );
} );
