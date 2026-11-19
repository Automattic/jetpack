import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const apiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const setCrawlers = jest.fn();
jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: apiFetch } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( { useDispatch: () => ( { setCrawlers } ) } ) );
jest.unstable_mockModule( '../../../data/geo-store', () => ( { geoStore: {} } ) );
const { default: DataSharingSettings } = await import( '../data-sharing-settings' );
const status = {
	prevent_sharing: false,
	locked: false,
	privacy_url: '/wp-admin/options-reading.php',
};
beforeEach( () => jest.resetAllMocks() );

it( 'sends only consent and refreshes crawler state after confirmation', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeEnabled() );
	const crawlers = { blocked: { training: [ 'gptbot' ], answer: [] }, dataSharingOptOut: true };
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( setCrawlers ).toHaveBeenCalledWith( crawlers ) );
	expect( apiFetch ).toHaveBeenNthCalledWith( 2, {
		path: '/jetpack/v4/seo/data-sharing',
		method: 'POST',
		data: { prevent_sharing: true },
	} );
	expect( control ).toBeChecked();
} );

it( 'shows effective protection without changing a saved preference while visibility locks it', async () => {
	apiFetch.mockResolvedValueOnce( { ...status, locked: true } );
	render( <DataSharingSettings visibility="private" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeChecked() );
	expect( control ).toHaveAttribute( 'aria-disabled', 'true' );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	expect( screen.getByRole( 'link', { name: 'Manage site visibility' } ) ).toHaveAttribute(
		'href',
		'/wp-admin/options-reading.php'
	);
} );

it( 'retains the saved value when consent is rejected', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch', { name: 'Prevent third-party sharing' } );
	await waitFor( () => expect( control ).toBeEnabled() );
	apiFetch.mockRejectedValueOnce( new Error( 'Rejected' ) ).mockResolvedValueOnce( status );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText( 'Unable to save the sharing preference. Please try again.' )
	).resolves.toBeInTheDocument();
	expect( control ).not.toBeChecked();
	expect( setCrawlers ).not.toHaveBeenCalled();
	await waitFor( () => expect( control ).toBeEnabled() );
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( control ).toBeChecked() );
	expect(
		screen.queryByText( 'Unable to save the sharing preference. Please try again.' )
	).not.toBeInTheDocument();
} );

it( 'shows no consent value until the initial request resolves', async () => {
	let resolveStatus!: ( value: unknown ) => void;
	apiFetch.mockReturnValueOnce(
		new Promise( resolve => {
			resolveStatus = resolve;
		} )
	);
	render( <DataSharingSettings visibility="public" /> );
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
	await act( async () => resolveStatus( status ) );
	await expect( screen.findByRole( 'switch' ) ).resolves.not.toBeChecked();
} );

it( 'does not offer an unconfirmed switch after a load error', async () => {
	apiFetch.mockRejectedValueOnce( new Error( 'Unavailable' ) );
	render( <DataSharingSettings visibility="public" /> );
	await expect(
		screen.findByText( 'Unable to load the sharing preference. Reload this page to try again.' )
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
} );

it( 'distinguishes a saved preference from a failed crawler refresh', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockRejectedValueOnce( new Error( 'Unavailable' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The preference was saved, but crawler status could not be refreshed. Reload this page to see the latest status.'
		)
	).resolves.toBeInTheDocument();
	expect( control ).toBeChecked();
	expect( control ).toBeEnabled();
	expect( setCrawlers ).not.toHaveBeenCalled();
} );

it( 'reports an unconfirmed save without claiming the requested value was stored', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch.mockResolvedValueOnce( status );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The sharing preference could not be confirmed. Reload this page before trying again.'
		)
	).resolves.toBeInTheDocument();
	expect( control ).not.toBeChecked();
	expect( setCrawlers ).not.toHaveBeenCalled();
} );

it( 'keeps a new visibility restriction when an older save response arrives', async () => {
	apiFetch.mockResolvedValueOnce( status );
	const { rerender } = render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	let resolveSave!: ( value: unknown ) => void;
	apiFetch
		.mockReturnValueOnce(
			new Promise( resolve => {
				resolveSave = resolve;
			} )
		)
		.mockResolvedValueOnce( { ...status, locked: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	rerender( <DataSharingSettings visibility="private" /> );
	await expect(
		screen.findByText( /Your site visibility settings already prevent sharing/ )
	).resolves.toBeInTheDocument();
	await act( async () => resolveSave( { ...status, prevent_sharing: true } ) );
	const restricted = screen.getByRole( 'switch' );
	expect( restricted ).toHaveAttribute( 'aria-disabled', 'true' );
	expect( restricted ).toBeChecked();
} );

it( 'recovers a persisted preference after a lost save response', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockRejectedValueOnce( new Error( 'Response interrupted after storage changed' ) )
		.mockResolvedValueOnce( { ...status, prevent_sharing: true } )
		.mockResolvedValueOnce( { crawlers: { dataSharingOptOut: true } } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await waitFor( () => expect( control ).toBeChecked() );
	expect( setCrawlers ).toHaveBeenCalledWith( { dataSharingOptOut: true } );
} );

it( 'hides an unconfirmed value when a failed save cannot re-read storage', async () => {
	apiFetch.mockResolvedValueOnce( status );
	render( <DataSharingSettings visibility="public" /> );
	const control = await screen.findByRole( 'switch' );
	apiFetch
		.mockRejectedValueOnce( new Error( 'Response interrupted' ) )
		.mockRejectedValueOnce( new Error( 'Readback unavailable' ) );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the package settings tests.
	fireEvent.click( control );
	await expect(
		screen.findByText(
			'The sharing preference could not be confirmed. Reload this page before trying again.'
		)
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'switch' ) ).not.toBeInTheDocument();
} );
