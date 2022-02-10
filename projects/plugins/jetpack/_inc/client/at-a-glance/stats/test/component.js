/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { DashStats } from '../index';

describe( 'Dashboard Stats', () => {
	let wrapper,
		testProps;

	before( function() {
		testProps = {
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
						shares_facebook: 0
					},
					visits: {
						unit: 'day',
						fields: [ 'period', 'views', 'visitors' ],
						data: [ [ '2018-02-20', 0, 0 ] ]
					}
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
	} );

	describe( 'Initially', () => {
		before( function() {
			wrapper = shallow( <DashStats { ...testProps } /> );
		} );

		it( 'renders header and card', () => {
			expect( wrapper.find( 'DashSectionHeader' ) ).to.have.length( 1 );
			expect( wrapper.find( '.jp-at-a-glance__stats-card' ) ).to.have.length( 1 );
		} );

		it( 'does not render date range tabs', () => {
			expect( wrapper.find( '.jp-at-a-glance__stats-views' ) ).to.have.length( 0 );
		} );

		describe( 'when stats are present, but empty', function() {
			before( function() {
				testProps.statsData.day = {
					unit: 'day',
					fields: [ 'period', 'views', 'visitors' ],
					// Mock no views for this date
					data: [ [ '2018-02-20', 0, 0 ] ]
				};
				wrapper = shallow( <DashStats { ...testProps } /> );
			} );

			it( 'renders the empty stats container', () => {
				expect( wrapper.find( '.jp-at-a-glance__stats-empty' ) ).to.have.length( 1 );
			} );
		} );
	} );

	describe( 'When empty stats card was dismissed', () => {
		before( function() {
			wrapper = shallow( <DashStats { ...testProps } isEmptyStatsCardDismissed={ true } /> );
		} );

		it( 'renders date range tabs', () => {
			expect( wrapper.find( '.jp-at-a-glance__stats-views' ) ).to.have.length( 1 );
		} );
	} );

	describe( 'When there is stats data', () => {
		before( function() {
			testProps.statsData.day = {
				unit: 'day',
				fields: [ 'period', 'views', 'visitors' ],
				// Mock 32 views for this date
				data: [ [ '2018-02-20', 32, 0 ] ]
			};
			wrapper = shallow(
				<DashStats { ...testProps } />
			);
		} );
		it( 'renders some stats', () => {
			expect( wrapper.find( '.jp-at-a-glance__stats-chart' ) ).to.have.length( 1 );
		} );
		it( 'and range tabs', () => {
			expect( wrapper.find( '.jp-at-a-glance__stats-views' ) ).to.have.length( 1 );
		} );
	} );
} );
