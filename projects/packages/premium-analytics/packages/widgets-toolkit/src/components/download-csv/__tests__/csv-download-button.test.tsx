/**
 * External dependencies
 */
import { act, fireEvent, render as baseRender, screen, waitFor } from '@testing-library/react';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../../../../tests/js/notice-test-utils';
import { CsvDownloadButton } from '../csv-download-button';
import type { ReactElement } from 'react';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const { registry, createErrorNotice } = createNoticesRegistry();

describe( 'CsvDownloadButton', () => {
	function render( ui: ReactElement ) {
		return baseRender( <RegistryProvider value={ registry }>{ ui }</RegistryProvider> );
	}

	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders the widget footer action as an icon named by its label', () => {
		render( <CsvDownloadButton onDownload={ jest.fn() } /> );

		const button = screen.getByRole( 'button', { name: 'Download CSV' } );
		expect( button ).toHaveTextContent( '' );
		// The decorative SVG is intentionally hidden from the accessibility tree.
		// eslint-disable-next-line testing-library/no-node-access
		expect( button.querySelector( 'svg' ) ).not.toBeNull();
	} );

	it( 'supports a solid page action with a visible label and no icon', () => {
		render(
			<CsvDownloadButton
				onDownload={ jest.fn() }
				label="Download"
				variant="solid"
				showIcon={ false }
				showLabel
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Download' } );
		expect( button ).toHaveClass( /is-solid/ );
		expect( button ).toHaveTextContent( 'Download' );
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
			expect( createErrorNotice ).toHaveBeenCalledWith( 'Upstream API unavailable.', {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upstream API unavailable.' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[
			'a plain-object API error',
			{ code: 'forbidden', message: 'Sorry, you are not allowed.' },
			'Sorry, you are not allowed.',
		],
		[ 'an error without a message', { code: 'unknown' }, 'Could not download report.' ],
	] )( 'shows %s in the snackbar', async ( _case, error, message ) => {
		render( <CsvDownloadButton onDownload={ () => Promise.reject( error ) } /> );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await waitFor( () =>
			expect( createErrorNotice ).toHaveBeenCalledWith( message, {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
	} );
} );
