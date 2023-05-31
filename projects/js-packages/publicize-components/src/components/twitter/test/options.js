/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicizeTwitterOptions } from '../options';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/build/components/use-dispatch/use-dispatch-with-map', () => jest.fn() );

describe( 'PublicizeTwitterOptions', () => {
	it( 'should expose the options component', () => {
		expect( PublicizeTwitterOptions ).toBeDefined();
	} );

	it( 'should not render with no twitter connections', () => {
		const connections = [ { service_name: 'facebook' }, { service_name: 'instagram' } ];
		render( <PublicizeTwitterOptions connections={ connections } /> );

		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
	} );

	it( 'should not render with only disabled twitter connections', () => {
		const connections = [ { service_name: 'twitter', enabled: false } ];
		render( <PublicizeTwitterOptions connections={ connections } /> );

		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
	} );

	it( 'should render with a twitter connection', () => {
		const connections = [ { service_name: 'twitter', enabled: true } ];
		render( <PublicizeTwitterOptions connections={ connections } /> );

		expect( screen.getByRole( 'radio', { name: /^Single Tweet/ } ) ).toBeChecked();
		expect( screen.getByRole( 'radio', { name: /^Twitter Thread/ } ) ).not.toBeChecked();
	} );

	it( 'should show the tweetstorm option selected when the isTweetStorm prop is set', () => {
		const connections = [ { service_name: 'twitter', enabled: true } ];
		const isTweetStorm = true;

		render( <PublicizeTwitterOptions connections={ connections } isTweetStorm={ isTweetStorm } /> );

		expect( screen.getByRole( 'radio', { name: /^Single Tweet/ } ) ).not.toBeChecked();
		expect( screen.getByRole( 'radio', { name: /^Twitter Thread/ } ) ).toBeChecked();
	} );

	it( 'should trigger change event when the selected option changes', async () => {
		const user = userEvent.setup();
		const connections = [ { service_name: 'twitter', enabled: true } ];
		const isTweetStorm = false;
		const setTweetstorm = jest.fn();

		render(
			<PublicizeTwitterOptions
				connections={ connections }
				setTweetstorm={ setTweetstorm }
				isTweetStorm={ isTweetStorm }
			/>
		);

		await user.click( screen.getByRole( 'radio', { name: /^Twitter Thread/ } ) );
		expect( setTweetstorm ).toHaveBeenCalled();
		expect( setTweetstorm ).toHaveBeenLastCalledWith( true );
	} );
} );
