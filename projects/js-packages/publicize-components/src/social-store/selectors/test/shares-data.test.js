import {
	getScheduledSharesCount,
	getShareLimit,
	getSharedPostsCount,
	getSharesUsedCount,
	getTotalSharesCount,
	isShareLimitEnabled,
	numberOfSharesRemaining,
	shouldShowAdvancedPlanNudge,
	showShareLimits,
} from '../shares-data';

describe( 'Social store selectors: sharesData', () => {
	describe( 'isShareLimitEnabled', () => {
		it( 'should return the default value when no data', () => {
			expect( isShareLimitEnabled( {} ) ).toBe( false );
			expect( isShareLimitEnabled( { sharesData: {} } ) ).toBe( false );
		} );

		it( 'should return the value from state', () => {
			expect( isShareLimitEnabled( { sharesData: { is_share_limit_enabled: true } } ) ).toBe(
				true
			);
			expect( isShareLimitEnabled( { sharesData: { is_share_limit_enabled: false } } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'showShareLimits', () => {
		it( 'should return the default value when no data', () => {
			expect( showShareLimits( {} ) ).toBe( false );
			expect( showShareLimits( { sharesData: {} } ) ).toBe( false );
		} );

		it( 'should fallback to isShareLimitEnabled if there is no paid plan', () => {
			expect( showShareLimits( { sharesData: { is_share_limit_enabled: true } } ) ).toBe( true );
			expect( showShareLimits( { sharesData: { s_share_limit_enabled: false } } ) ).toBe( false );
		} );

		it( 'should return false if there is a paid plan', () => {
			expect(
				showShareLimits( {
					sharesData: {
						is_share_limit_enabled: true,
					},
					hasPaidPlan: true,
				} )
			).toBe( false );

			expect(
				showShareLimits( {
					jetpackSettings: { showNudge: false },
					sharesData: { is_share_limit_enabled: true },
				} )
			).toBe( false );
		} );
	} );

	describe( 'getShareLimit', () => {
		it( 'should return the default value when no data', () => {
			expect( getShareLimit( {} ) ).toBe( 30 );
			expect( getShareLimit( { sharesData: {} } ) ).toBe( 30 );
		} );

		it( 'should return the value from state', () => {
			expect( getShareLimit( { sharesData: { share_limit: 100 } } ) ).toBe( 100 );
			expect( getShareLimit( { sharesData: { share_limit: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'getSharesUsedCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getSharesUsedCount( {} ) ).toBe( 0 );
			expect( getSharesUsedCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getSharesUsedCount( { sharesData: { publicized_count: 100 } } ) ).toBe( 100 );
			expect( getSharesUsedCount( { sharesData: { publicized_count: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'getScheduledSharesCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getScheduledSharesCount( {} ) ).toBe( 0 );
			expect( getScheduledSharesCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getScheduledSharesCount( { sharesData: { to_be_publicized_count: 100 } } ) ).toBe(
				100
			);
			expect( getScheduledSharesCount( { sharesData: { to_be_publicized_count: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'getTotalSharesCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getTotalSharesCount( {} ) ).toBe( 0 );
			expect( getTotalSharesCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			const cases = [
				[ [ 100, 100 ], 200 ],
				[ [ 0, 0 ], 0 ],
				[ [ 100, 0 ], 100 ],
				[ [ 0, 100 ], 100 ],
			];

			for ( const [ [ publicized_count, to_be_publicized_count ], result ] of cases ) {
				expect(
					getTotalSharesCount( {
						sharesData: {
							to_be_publicized_count,
							publicized_count,
						},
					} )
				).toBe( result );
			}
		} );
	} );

	describe( 'getSharedPostsCount', () => {
		it( 'should return the default value when no data', () => {
			expect( getSharedPostsCount( {} ) ).toBe( 0 );
			expect( getSharedPostsCount( { sharesData: {} } ) ).toBe( 0 );
		} );

		it( 'should return the value from state', () => {
			expect( getSharedPostsCount( { sharesData: { shared_posts_count: 100 } } ) ).toBe( 100 );
			expect( getSharedPostsCount( { sharesData: { shared_posts_count: 0 } } ) ).toBe( 0 );
		} );
	} );

	describe( 'shouldShowAdvancedPlanNudge', () => {
		it( 'should return the default value when no data', () => {
			expect( shouldShowAdvancedPlanNudge( {} ) ).toBe( false );
			expect( shouldShowAdvancedPlanNudge( { sharesData: {} } ) ).toBe( false );
		} );

		it( 'should return the value from state', () => {
			expect(
				shouldShowAdvancedPlanNudge( { sharesData: { show_advanced_plan_upgrade_nudge: true } } )
			).toBe( true );

			expect(
				shouldShowAdvancedPlanNudge( { sharesData: { show_advanced_plan_upgrade_nudge: false } } )
			).toBe( false );
		} );
	} );
	describe( 'numberOfSharesRemaining', () => {
		it( 'should return infinity when share limits are not applied', () => {
			expect( numberOfSharesRemaining( {} ) ).toBe( Infinity );
			expect( numberOfSharesRemaining( { sharesData: { is_share_limit_enabled: false } } ) ).toBe(
				Infinity
			);
		} );

		it( 'should return 0 instead of negative number when limits are crossed', () => {
			expect(
				numberOfSharesRemaining( {
					sharesData: {
						is_share_limit_enabled: true,
						publicized_count: 35,
					},
				} )
			).toBe( 0 );
		} );

		const suites = [
			[
				'should count used and scheduled shares',
				{
					includeScheduled: true,
				},
				[
					{
						sharesUsed: 10,
						scheduledShares: 10,
						result: 10,
					},
					{
						sharesUsed: 20,
						scheduledShares: 10,
						result: 0,
					},
					{
						sharesUsed: 0,
						scheduledShares: 0,
						result: 30,
					},
				],
			],
			[
				'should count used shares but not the scheduled shares',
				{
					includeScheduled: false,
				},
				[
					{
						sharesUsed: 10,
						scheduledShares: 10,
						result: 20,
					},
					{
						sharesUsed: 30,
						scheduledShares: 10,
						result: 0,
					},
					{
						sharesUsed: 0,
						scheduledShares: 0,
						result: 30,
					},
				],
			],
		];

		for ( const [ name, args, cases ] of suites ) {
			it( `${ name }`, () => {
				for ( const { sharesUsed, scheduledShares, result } of cases ) {
					expect(
						numberOfSharesRemaining(
							{
								sharesData: {
									is_share_limit_enabled: true,
									publicized_count: sharesUsed,
									to_be_publicized_count: scheduledShares,
									share_limit: 30,
								},
							},
							args
						)
					).toBe( result );
				}
			} );
		}
	} );
} );
