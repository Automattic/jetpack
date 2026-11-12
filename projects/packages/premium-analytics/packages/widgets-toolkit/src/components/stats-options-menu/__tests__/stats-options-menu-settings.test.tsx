/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import {
	getMockRouteLinkUrl,
	setMockRoutePath,
	setMockRouteSearch,
} from '../../../../../../tests/js/route-test-utils';
import { DashboardSectionProvider } from '../../../hooks/use-dashboard-origin-search';
import { StatsOptionsMenu } from '../stats-options-menu';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock(
	'@wordpress/route',
	() => jest.requireActual( '../../../../../../tests/js/route-test-utils' ).mockWordPressRoute
);

const WITH_SETTINGS = {
	premium_analytics: { stats_settings: { roles: [], features_url: null } },
} as ReturnType< typeof getScriptData >;

describe( 'stats-options-menu Settings entry', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		setMockRouteSearch();
		setMockRoutePath();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'links to the Settings page, with the report window and the tab to return to', async () => {
		jest.mocked( getScriptData ).mockReturnValue( WITH_SETTINGS );
		setMockRouteSearch( { preset: 'last-30-days', section: 'traffic' } );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render(
			<DashboardSectionProvider section="traffic">
				<StatsOptionsMenu />
			</DashboardSectionProvider>
		);
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );

		const url = getMockRouteLinkUrl( await screen.findByRole( 'menuitem', { name: 'Settings' } ) );
		expect( url.pathname ).toBe( '/settings' );
		expect( url.searchParams.get( 'preset' ) ).toBe( 'last-30-days' );
		expect( url.searchParams.get( 'ds' ) ).toBe( 'traffic' );
		expect( url.searchParams.has( 'section' ) ).toBe( false );
	} );

	it.each( [
		{ page: 'the Settings page', path: '/settings' },
		{ page: 'the connect page, which its guard would bounce back to', path: '/connect' },
	] )( 'is disabled on $page', async ( { path } ) => {
		jest.mocked( getScriptData ).mockReturnValue( WITH_SETTINGS );
		setMockRoutePath( path );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <StatsOptionsMenu /> );
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );

		const settings = await screen.findByRole( 'menuitem', { name: 'Settings' } );
		expect( settings ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( settings ).not.toHaveAttribute( 'href' );
	} );

	it( 'sits apart from the layout options above it', async () => {
		jest.mocked( getScriptData ).mockReturnValue( WITH_SETTINGS );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <StatsOptionsMenu /> );
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );

		const settings = await screen.findByRole( 'menuitem', { name: 'Settings' } );
		const separatorsAbove = screen
			.queryAllByRole( 'separator' )
			.filter(
				separator =>
					separator.compareDocumentPosition( settings ) === Node.DOCUMENT_POSITION_FOLLOWING
			);

		expect( separatorsAbove ).toHaveLength( 1 );
	} );

	it( 'is absent where the site hands the user no Stats settings', async () => {
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <StatsOptionsMenu /> );
		await user.click( screen.getByRole( 'button', { name: 'Stats options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Settings' } ) ).not.toBeInTheDocument();
	} );
} );
