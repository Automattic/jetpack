/**
 * External dependencies
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { CsvDownloadButton } from '../csv-download-button';

const mockCreateErrorNotice = jest.fn();
const mockDispatch = jest.fn( () => ( {
	createErrorNotice: mockCreateErrorNotice,
} ) );

// Override `useRegistry` only, falling through to the real module for everything else:
// the component's import graph now reaches other consumers of `@wordpress/data`
// (rich-text's store calls `combineReducers` at import time), which a `useRegistry`-only
// mock breaks. The fall-through has to resolve lazily — calling `requireActual` in the
// factory body re-enters `@wordpress/data` while it is still initialising.
jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{ useRegistry: () => ( { dispatch: mockDispatch } ) },
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

describe( 'CsvDownloadButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'supports a solid page action without an icon', () => {
		render(
			<CsvDownloadButton
				onDownload={ jest.fn() }
				label="Download"
				variant="solid"
				showIcon={ false }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Download' } );
		expect( button ).toHaveClass( /is-solid/ );
		// The decorative SVG is intentionally hidden from the accessibility tree.
		// eslint-disable-next-line testing-library/no-node-access
		expect( button.querySelector( 'svg' ) ).toBeNull();
	} );

	it( 'shows a loading state and prevents duplicate downloads while busy', async () => {
		let resolveDownload: () => void = () => {};
		const onDownload = jest.fn(
			() =>
				new Promise< void >( resolve => {
					resolveDownload = resolve;
				} )
		);

		render( <CsvDownloadButton onDownload={ onDownload } /> );

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'true' ) );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );
		expect( onDownload ).toHaveBeenCalledTimes( 1 );

		await act( async () => resolveDownload() );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'shows download failures in a dismissible snackbar', async () => {
		render(
			<CsvDownloadButton
				onDownload={ () => Promise.reject( new Error( 'Upstream API unavailable.' ) ) }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () =>
			expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Upstream API unavailable.', {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
		expect( mockDispatch ).toHaveBeenCalledWith( 'core/notices' );
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upstream API unavailable.' ) ).not.toBeInTheDocument();
	} );
} );
