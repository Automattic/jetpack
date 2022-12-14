import { getRedirectUrl } from '@automattic/jetpack-components';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { DashStats } from '../index';

// Mock components that do fetches in the background. We supply needed state directly.
jest.mock( 'components/data/query-stats-data', () => ( {
	__esModule: true,
	default: () => 'query-stats-data',
} ) );

describe( 'Dashboard Stats', () => {
	const testProps = {
		siteRawUrl: 'example.org',
		siteAdminUrl: 'example.org/wp-admin',
		statsData: {
			general: {
				date: '2018-03-21',
				stats: {
					visitors_today: 0,
					visitors_yesterday: 0,
					visitors: 24,
					views_today: 0,
					views_yesterday: 0,
					views_best_day: '2017-05-18',
					views_best_day_total: 11,
					views: 59,
					comments: 6,
					posts: 11,
					followers_blog: 0,
					followers_comments: 0,
					comments_per_month: 0,
					comments_most_active_recent_day: '2016-03-08 20:37:56',
					comments_most_active_time: '17:00',
					comments_spam: 0,
					categories: 3,
					tags: 0,
					shares: 0,
					shares_twitter: 0,
					'shares_google-plus-1': 0,
					'shares_custom-1513105119': 0,
					shares_facebook: 0,
				},
				visits: {
					unit: 'day',
					fields: [ 'period', 'views', 'visitors' ],
					data: [ [ '2018-02-20', 0, 0 ] ],
				},
			},
			day: undefined,
		},
		isModuleAvailable: true,
		isOfflineMode: false,
		moduleList: { stats: {} },
		activeTab: 'day',
		isLinked: true,
		connectUrl: getRedirectUrl( 'calypso-jetpack-connect' ),
		isEmptyStatsCardDismissed: false,
		getOptionValue: module => 'stats' === module,
		getModuleOverride: () => false,
	};
	const initialState = {
		jetpack: {
			initialState: {
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
			},
		},
	};

	describe( 'Initially', () => {
		it( 'renders header and card', () => {
			render( <DashStats { ...testProps } />, { initialState } );
			expect( screen.getByRole( 'heading', { name: 'Jetpack Stats' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'View detailed stats' } ) ).toBeInTheDocument();
		} );

		it( 'does not render date range tabs', () => {
			render( <DashStats { ...testProps } />, { initialState } );
			expect( screen.queryByRole( 'link', { name: 'Days' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: 'Weeks' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: 'Months' } ) ).not.toBeInTheDocument();
		} );

		describe( 'when stats are present, but empty', () => {
			const props = {
				...testProps,
				statsData: {
					...testProps.statsData,
					day: {
						unit: 'day',
						fields: [ 'period', 'views', 'visitors' ],
						// Mock no views for this date
						data: [ [ '2018-02-20', 0, 0 ] ],
					},
				},
			};

			it( 'renders the empty stats container', () => {
				render( <DashStats { ...props } />, { initialState } );
				expect(
					screen.getByText(
						/Just give us a little time to collect data so we can display it for you here/
					)
				).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'When empty stats card was dismissed', () => {
		it( 'renders date range tabs', () => {
			render( <DashStats { ...testProps } isEmptyStatsCardDismissed={ true } />, { initialState } );
			expect( screen.getByRole( 'link', { name: 'Days' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Weeks' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Months' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When there is stats data', () => {
		const props = {
			...testProps,
			statsData: {
				...testProps.statsData,
				day: {
					unit: 'day',
					fields: [ 'period', 'views', 'visitors' ],
					// Mock 32 views for this date
					data: [ [ '2018-02-20', 32, 0 ] ],
				},
			},
		};
		it( 'renders some stats', () => {
			const { container } = render( <DashStats { ...props } />, { initialState } );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-at-a-glance__stats-chart' ) ).toBeInTheDocument();
		} );
		it( 'and range tabs', () => {
			render( <DashStats { ...props } />, { initialState } );
			expect( screen.getByRole( 'link', { name: 'Days' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Weeks' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Months' } ) ).toBeInTheDocument();
		} );
	} );
} );
