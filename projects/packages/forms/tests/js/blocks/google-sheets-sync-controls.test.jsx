import { describe, expect, test, jest, beforeEach } from '@jest/globals';

const apiFetchMock = jest.fn();

await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: apiFetchMock,
} ) );

const { render, screen, waitFor } = await import( '@testing-library/react' );
const userEvent = ( await import( '@testing-library/user-event' ) ).default;

const GoogleSheetsSyncControls = (
	await import(
		'../../../src/blocks/contact-form/components/jetpack-integrations-modal/components/google-sheets-sync-controls.tsx'
	)
).default;

const { looksLikeSpreadsheetReference } = await import(
	'../../../src/blocks/contact-form/components/jetpack-integrations-modal/components/google-sheets-sync-controls.tsx'
);

/**
 * Render the controls with sensible defaults.
 *
 * @param {object} props - Overrides for the component props.
 * @return {object} The render result plus the setGoogleSheetsData spy.
 */
function renderControls( props = {} ) {
	const setGoogleSheetsData = jest.fn();

	const view = render(
		<GoogleSheetsSyncControls
			googleSheetsData={ {} }
			setGoogleSheetsData={ setGoogleSheetsData }
			formPostId={ 42 }
			formTitle="Contact us"
			{ ...props }
		/>
	);

	return { ...view, setGoogleSheetsData };
}

describe( 'looksLikeSpreadsheetReference', () => {
	test.each( [
		[ 'https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit#gid=0', true ],
		[ 'https://docs.google.com/spreadsheets/d/1AbC-dEf_123', true ],
		[ '1AbC-dEf_123', true ],
		[ 'https://docs.google.com/document/d/1AbC-dEf_123/edit', false ],
		[ 'https://example.com/nope', false ],
		[ 'abc', false ],
		[ '', false ],
	] )( 'treats %s as %s', ( reference, expected ) => {
		expect( looksLikeSpreadsheetReference( reference ) ).toBe( expected );
	} );
} );

describe( 'GoogleSheetsSyncControls', () => {
	beforeEach( () => {
		apiFetchMock.mockReset();
	} );

	test( 'shows the setup form when no spreadsheet is configured', () => {
		renderControls();

		expect( screen.getByText( 'Create a new spreadsheet' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Set up syncing' } ) ).toBeEnabled();
	} );

	test( 'shows a link to the spreadsheet once configured, and no setup form', () => {
		renderControls( {
			googleSheetsData: {
				enabled: true,
				spreadsheetId: 'abc123',
				spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc123/edit',
			},
		} );

		expect( screen.getByText( 'Open spreadsheet' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Set up syncing' } ) ).not.toBeInTheDocument();
	} );

	test( 'blocks submission until an existing spreadsheet link looks valid', async () => {
		const user = userEvent.setup();
		renderControls();

		await user.click( screen.getByLabelText( 'Use an existing spreadsheet' ) );

		const submit = screen.getByRole( 'button', { name: 'Set up syncing' } );
		expect( submit ).toBeDisabled();

		// Note this has to be something that is not merely *wrong* but not even
		// shaped like an ID. A bare spreadsheet ID is just a run of URL-safe
		// characters, so a string like "not-a-sheet" is indistinguishable from one
		// by shape alone; the server is what actually rejects it.
		await user.type( screen.getByLabelText( 'Spreadsheet link' ), 'not a sheet!' );
		expect( submit ).toBeDisabled();

		await user.clear( screen.getByLabelText( 'Spreadsheet link' ) );
		await user.type(
			screen.getByLabelText( 'Spreadsheet link' ),
			'https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit'
		);
		expect( submit ).toBeEnabled();
	} );

	test( 'stores what the server returns', async () => {
		const user = userEvent.setup();
		apiFetchMock.mockResolvedValue( {
			spreadsheetId: 'sheet-1',
			spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-1/edit',
			columns: [ 'Name', 'Email' ],
		} );

		const { setGoogleSheetsData } = renderControls();

		await user.click( screen.getByRole( 'button', { name: 'Set up syncing' } ) );

		await waitFor( () => {
			expect( setGoogleSheetsData ).toHaveBeenCalledWith( {
				enabled: true,
				spreadsheetId: 'sheet-1',
				spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-1/edit',
				columns: [ 'Name', 'Email' ],
			} );
		} );

		expect( apiFetchMock ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/wp/v2/feedback/integrations/google-sheets/setup',
				method: 'POST',
				data: expect.objectContaining( {
					form_post_id: 42,
					title: 'Contact us',
					mode: 'create',
					backfill: true,
				} ),
			} )
		);
	} );

	test( 'surfaces a setup failure and does not store anything', async () => {
		const user = userEvent.setup();
		apiFetchMock.mockRejectedValue( { message: 'That does not look like a Google Sheets link.' } );

		const { setGoogleSheetsData } = renderControls();

		await user.click( screen.getByRole( 'button', { name: 'Set up syncing' } ) );

		// getAllByText because the notice renders the message visibly and again for
		// assistive technology.
		await waitFor( () => {
			expect(
				screen.getAllByText( 'That does not look like a Google Sheets link.' ).length
			).toBeGreaterThan( 0 );
		} );

		expect( setGoogleSheetsData ).not.toHaveBeenCalled();
	} );
} );
