/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { useEmailsReportRecords } from './config';
import EmailsReportPage from './page';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useEmailsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/',
} ) );

// `Breadcrumbs` and the title `Link` both reach for router context this
// page-level test has no need to provide; neither is what these assertions cover.
jest.mock( '@wordpress/admin-ui', () => ( {
	...jest.requireActual( '@wordpress/admin-ui' ),
	Breadcrumbs: () => null,
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children }: { children: ReactNode } ) => <a href="/post">{ children }</a>,
} ) );

const useRecordsMock = jest.mocked( useEmailsReportRecords );

/**
 * Build an email summary row for the page under test.
 *
 * @param overrides - The fields to override on the base row.
 * @return The email summary row.
 */
function buildRow( overrides: Partial< StatsEmailSummaryItem > ): StatsEmailSummaryItem {
	return {
		id: 91,
		label: 'Hello world',
		value: 120,
		date: '2026-07-10',
		opens: 120,
		clicks: 14,
		opens_rate: 38.1,
		clicks_rate: 3.81,
		unique_opens: 98,
		unique_clicks: 11,
		total_sends: 250,
		children: null,
		...overrides,
	};
}

/**
 * Build a records-hook return value for the page under test.
 *
 * @param overrides - The fields to override on the successful-empty default.
 * @return The mocked hook result.
 */
function buildRecords( overrides: Partial< ReturnType< typeof useEmailsReportRecords > > ) {
	return {
		rows: [],
		isLoading: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as ReturnType< typeof useEmailsReportRecords >;
}

describe( 'EmailsReportPage', () => {
	it( 'renders email rows with counts and 0–100 rates suffixed as percentages', () => {
		useRecordsMock.mockReturnValue( buildRecords( { rows: [ buildRow( {} ) ] } ) );

		render( <EmailsReportPage /> );

		expect( screen.getByText( 'Hello world' ) ).toBeInTheDocument();
		// The summary endpoint reports rates as 0–100 percentages, so 38.1
		// renders as 38.1% — not multiplied or divided.
		expect( screen.getByText( '38.1%' ) ).toBeInTheDocument();
		expect( screen.getByText( '3.81%' ) ).toBeInTheDocument();
	} );

	it( 'dashes a rate whose events could not be attributed to recipients', () => {
		// One click happened, but no recipient was attributed (unique = 0):
		// a literal 0% would misread as the click being ignored.
		useRecordsMock.mockReturnValue(
			buildRecords( {
				rows: [ buildRow( { clicks: 1, unique_clicks: 0, clicks_rate: 0 } ) ],
			} )
		);

		render( <EmailsReportPage /> );

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
		// Zero events still reads 0%, not a dash — only attribution gaps dash.
		expect( screen.queryByText( '0%' ) ).not.toBeInTheDocument();
	} );

	it( 'surfaces the error and retry instead of the table', async () => {
		const refetch = jest.fn();
		useRecordsMock.mockReturnValue(
			buildRecords( { rows: [ buildRow( {} ) ], isError: true, refetch } )
		);

		render( <EmailsReportPage /> );

		expect( screen.getByText( 'Unable to load emails' ) ).toBeInTheDocument();
		await userEvent.setup().click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalled();
	} );
} );
