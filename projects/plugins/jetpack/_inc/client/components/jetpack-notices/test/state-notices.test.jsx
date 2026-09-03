import { render, screen } from 'test/test-utils';
import JetpackStateNotices from '../state-notices';

/**
 * Render the notice with the given Jetpack state.
 *
 * @param {object} jetpackStateNotices - The `jetpackStateNotices` initial state.
 * @return {object} Render result.
 */
function renderWithState( jetpackStateNotices ) {
	return render( <JetpackStateNotices />, {
		initialState: { jetpack: { initialState: { jetpackStateNotices } } },
	} );
}

describe( 'JetpackStateNotices', () => {
	it( 'frames jetpack_id rather than showing the raw response body', () => {
		renderWithState( { errorCode: 'jetpack_id', errorDescription: '' } );

		expect(
			screen.getByText( /contact support with this message: jetpack_id/ )
		).toBeInTheDocument();
		expect(
			screen.queryByText( /Do not publicly post this error message/ )
		).not.toBeInTheDocument();
	} );

	it( 'frames cannot_save_secrets and keeps its message as the description', () => {
		const { container } = renderWithState( {
			errorCode: 'cannot_save_secrets',
			errorDescription: 'Ask your hosting provider whether the options table is writable.',
		} );

		expect(
			screen.getByText( /contact support with this message: cannot_save_secrets/ )
		).toBeInTheDocument();
		// The description is a text node beside the message, so assert on the notice's text.
		expect( container ).toHaveTextContent(
			'Ask your hosting provider whether the options table is writable.'
		);
	} );

	it( 'shows the WordPress.com outage copy for wpcom_bad_response with no status number', () => {
		renderWithState( { errorCode: 'wpcom_bad_response', errorDescription: '' } );

		expect( screen.getByText( /WordPress\.com is currently having problems/ ) ).toBeInTheDocument();
		expect( screen.queryByText( '503' ) ).not.toBeInTheDocument();
	} );

	it( 'frames an unmapped code when a description was supplied', () => {
		const { container } = renderWithState( {
			errorCode: 'xml_rpc-32601',
			errorDescription: 'requested method jetpack.verifyRegistration does not exist',
		} );

		expect(
			screen.getByText( /contact support with this message: xml_rpc-32601/ )
		).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'requested method jetpack.verifyRegistration does not exist'
		);
	} );

	it( 'shows an unmapped code unchanged when there is no description', () => {
		renderWithState( { errorCode: 'xml_rpc-32601', errorDescription: '' } );

		expect( screen.getByText( 'xml_rpc-32601' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Your Jetpack has a glitch/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing without an error or message code', () => {
		const { container } = renderWithState( {} );

		expect( container ).toHaveTextContent( '' );
	} );
} );
