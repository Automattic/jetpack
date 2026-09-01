import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FetchErrorNotice from '../index';

describe( 'FetchErrorNotice', () => {
	it( 'renders the generic sentence with a working Retry action', async () => {
		const onRetry = jest.fn();
		const user = userEvent.setup();

		render( <FetchErrorNotice message="We couldn’t load your videos." onRetry={ onRetry } /> );

		expect( screen.getByText( 'We couldn’t load your videos.' ) ).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'appends the detail from an Error instance', () => {
		render(
			<FetchErrorNotice
				message="We couldn’t load your videos."
				error={ new Error( 'Request timed out.' ) }
				onRetry={ () => undefined }
			/>
		);

		expect(
			screen.getByText( 'We couldn’t load your videos. Request timed out.' )
		).toBeInTheDocument();
	} );

	it( 'appends the detail from an api-fetch rejection object', () => {
		// @wordpress/api-fetch rejects with a plain { code, message } object
		// rather than an Error instance.
		render(
			<FetchErrorNotice
				message="We couldn’t load your videos."
				error={ { code: 'rest_error', message: 'Cookie nonce is invalid' } }
				onRetry={ () => undefined }
			/>
		);

		expect(
			screen.getByText( 'We couldn’t load your videos. Cookie nonce is invalid' )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'a raw Response with no message', { status: 500 } ],
		[ 'a whitespace-only message', { message: '   ' } ],
		[ 'a non-string message', { message: 42 } ],
		[ 'a null error', null ],
		[ 'an undefined error', undefined ],
	] )( 'renders only the generic sentence for %s', ( _label, error ) => {
		render(
			<FetchErrorNotice
				message="We couldn’t load your videos."
				error={ error }
				onRetry={ () => undefined }
			/>
		);

		// Exact match: nothing was appended after the generic sentence.
		expect( screen.getByText( 'We couldn’t load your videos.' ) ).toBeInTheDocument();
	} );
} );
