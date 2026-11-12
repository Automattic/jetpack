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
	setMockRouteSearch,
} from '../../../../../../tests/js/route-test-utils';
import { DashboardSectionProvider } from '../../../hooks/use-dashboard-origin-search';
import { PageOptionsMenu } from '../page-options-menu';

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

describe( 'page-options-menu Settings entry', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		setMockRouteSearch();
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
				<PageOptionsMenu />
			</DashboardSectionProvider>
		);
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		const url = getMockRouteLinkUrl( await screen.findByRole( 'menuitem', { name: 'Settings' } ) );
		expect( url.pathname ).toBe( '/settings' );
		expect( url.searchParams.get( 'preset' ) ).toBe( 'last-30-days' );
		expect( url.searchParams.get( 'ds' ) ).toBe( 'traffic' );
		expect( url.searchParams.has( 'section' ) ).toBe( false );
	} );

	it.each( [
		{ name: 'sits apart from the entries above it', onCustomize: () => {}, above: 1 },
		{ name: 'has no separator above it as the first entry', onCustomize: undefined, above: 0 },
	] )( '$name', async ( { onCustomize, above } ) => {
		jest.mocked( getScriptData ).mockReturnValue( WITH_SETTINGS );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <PageOptionsMenu onCustomize={ onCustomize } /> );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		const settings = await screen.findByRole( 'menuitem', { name: 'Settings' } );
		const separatorsAbove = screen
			.queryAllByRole( 'separator' )
			.filter(
				separator =>
					separator.compareDocumentPosition( settings ) === Node.DOCUMENT_POSITION_FOLLOWING
			);

		expect( separatorsAbove ).toHaveLength( above );
	} );

	it( 'is absent where the site hands the user no Stats settings', async () => {
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <PageOptionsMenu /> );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Settings' } ) ).not.toBeInTheDocument();
	} );
} );
