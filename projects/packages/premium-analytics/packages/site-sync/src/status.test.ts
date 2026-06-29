import { toSyncStatus, isSyncComplete, isSyncStalled } from './status';

describe( 'toSyncStatus', () => {
	it( 'reports not-started when the sync has never run', () => {
		const status = toSyncStatus( { started: false }, 0 );
		expect( status ).toEqual( {
			isStarted: false,
			isRunning: false,
			percentage: 0,
			initialFullSyncFinished: 0,
			hasStoreData: true,
		} );
	} );

	it( 'computes analytics-scoped percentage from the module bucket', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: { woocommerce_analytics: { sent: 1, total: 4 } },
			},
			0
		);
		expect( status.isRunning ).toBe( true );
		expect( status.percentage ).toBe( 25 );
	} );

	it( 'ignores non-analytics modules when computing percentage', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: {
					posts: { sent: 100, total: 100 },
					woocommerce_analytics: { sent: 1, total: 2 },
				},
			},
			0
		);
		expect( status.percentage ).toBe( 50 );
	} );

	it( 'is 100% when the page-load milestone is set', () => {
		const status = toSyncStatus( { started: false }, 1_700_000_000 );
		expect( status.percentage ).toBe( 100 );
		expect( status.initialFullSyncFinished ).toBe( 1_700_000_000 );
	} );

	it( 'is 100% when the analytics module has no rows to sync (empty store)', () => {
		// Bucket present but total 0 ⇒ nothing to sync ⇒ done, mirroring upstream —
		// avoids a progress bar stuck at 0% while the empty sync completes.
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: { woocommerce_analytics: { sent: 0, total: 0 } },
			},
			0
		);
		expect( status.isStarted ).toBe( true );
		expect( status.percentage ).toBe( 100 );
	} );

	it( 'caps percentage at 100', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: { woocommerce_analytics: { sent: 9, total: 4 } },
			},
			0
		);
		expect( status.percentage ).toBe( 100 );
	} );

	it( 'is not complete from progress alone until the milestone is set', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: { woocommerce_analytics: { sent: 2, total: 2 } },
			},
			0
		);
		expect( status.percentage ).toBe( 100 );
		expect( status.isRunning ).toBe( true );
		// 100% progress but the milestone is unset ⇒ not complete (AND), and not
		// stalled because the sync is still running.
		expect( isSyncComplete( status ) ).toBe( false );
		expect( isSyncStalled( status ) ).toBe( false );
	} );

	it( 'is complete once progress is 100% and the milestone is set', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: true,
				progress: { woocommerce_analytics: { sent: 2, total: 2 } },
			},
			1_700_000_000
		);
		expect( status.percentage ).toBe( 100 );
		expect( isSyncComplete( status ) ).toBe( true );
		expect( isSyncStalled( status ) ).toBe( false );
	} );

	it( 'is not started or stalled after the connection-time initial_sync (no analytics bucket)', () => {
		// Jetpack runs a lightweight initial_sync on connection (options/functions/
		// users only) that sets started/finished but never includes the analytics
		// module. The screen must treat this as "not started yet" so it auto-triggers
		// the analytics sync — NOT classify the finished initial_sync as a stalled
		// analytics sync ("Sync interrupted").
		const status = toSyncStatus(
			{
				started: true,
				finished: 1_700_000_000,
				progress: {
					options: { sent: 432, total: 432 },
					users: { sent: 1, total: 1 },
				},
			},
			0
		);
		expect( status.isStarted ).toBe( false );
		expect( status.isRunning ).toBe( false );
		expect( isSyncStalled( status ) ).toBe( false );
		expect( isSyncComplete( status ) ).toBe( false );
	} );

	it( 'treats a numeric finished timestamp as finished', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: 1_700_000_000,
				progress: { woocommerce_analytics: { sent: 1, total: 2 } },
			},
			0
		);
		// total > 0 branch: floor(1/2 * 100) = 50; numeric finished coerces to true
		// so isRunning = started && !finished = false.
		expect( status.percentage ).toBe( 50 );
		expect( status.isRunning ).toBe( false );
		expect( isSyncStalled( status ) ).toBe( true );
	} );
} );

describe( 'toSyncStatus without an analytics backend (hasStoreData = false)', () => {
	it( 'reports not-started before any sync runs, so the screen auto-triggers', () => {
		const status = toSyncStatus( { started: false }, 0, false );
		expect( status ).toEqual( {
			isStarted: false,
			isRunning: false,
			percentage: 0,
			initialFullSyncFinished: 0,
			hasStoreData: false,
		} );
	} );

	it( 'tracks an in-flight generic full sync as running', () => {
		const status = toSyncStatus( { started: true, finished: false }, 0, false );
		expect( status.isStarted ).toBe( true );
		expect( status.isRunning ).toBe( true );
	} );

	it( 'sums progress across all modules for the percentage', () => {
		const status = toSyncStatus(
			{
				started: true,
				finished: false,
				progress: {
					options: { sent: 1, total: 2 },
					posts: { sent: 1, total: 2 },
				},
			},
			0,
			false
		);
		// (1 + 1) / (2 + 2) = 50%
		expect( status.percentage ).toBe( 50 );
	} );

	it( 'does not treat a finished connection-time initial_sync as stalled', () => {
		// The connection-time initial_sync sets started/finished before the user
		// triggers anything. Without a backend we must still auto-trigger rather
		// than show "Sync interrupted", so this is neither started nor stalled.
		const status = toSyncStatus(
			{ started: true, finished: 1_700_000_000, progress: { options: { sent: 1, total: 1 } } },
			0,
			false
		);
		expect( status.isStarted ).toBe( false );
		expect( status.isRunning ).toBe( false );
		// Percentage stays 0: the milestone is unset and the sync is not in flight, so
		// the stale 100% progress of the connection-time sync must not flash a full bar.
		expect( status.percentage ).toBe( 0 );
		expect( isSyncStalled( status ) ).toBe( false );
		expect( isSyncComplete( status ) ).toBe( false );
	} );

	it( 'is complete once the generic full sync milestone is set', () => {
		const status = toSyncStatus( { started: true, finished: true }, 1_700_000_000, false );
		expect( status.percentage ).toBe( 100 );
		expect( isSyncComplete( status ) ).toBe( true );
	} );
} );

describe( 'isSyncComplete', () => {
	it( 'is complete when the milestone is set', () => {
		expect(
			isSyncComplete( {
				isStarted: false,
				isRunning: false,
				percentage: 100,
				initialFullSyncFinished: 1_700_000_000,
				hasStoreData: true,
			} )
		).toBe( true );
	} );

	it( 'is not complete from progress alone without the milestone', () => {
		expect(
			isSyncComplete( {
				isStarted: true,
				isRunning: false,
				percentage: 100,
				initialFullSyncFinished: 0,
				hasStoreData: true,
			} )
		).toBe( false );
	} );

	it( 'is not complete when the milestone is set but progress is below 100', () => {
		expect(
			isSyncComplete( {
				isStarted: true,
				isRunning: true,
				percentage: 50,
				initialFullSyncFinished: 1_700_000_000,
				hasStoreData: true,
			} )
		).toBe( false );
	} );

	it( 'is not complete mid-progress', () => {
		expect(
			isSyncComplete( {
				isStarted: true,
				isRunning: true,
				percentage: 50,
				initialFullSyncFinished: 0,
				hasStoreData: true,
			} )
		).toBe( false );
	} );
} );

describe( 'isSyncStalled', () => {
	it( 'is stalled when started, no longer running, and not complete', () => {
		expect(
			isSyncStalled( {
				isStarted: true,
				isRunning: false,
				percentage: 50,
				initialFullSyncFinished: 0,
				hasStoreData: true,
			} )
		).toBe( true );
	} );

	it( 'is not stalled when it never started', () => {
		expect(
			isSyncStalled( {
				isStarted: false,
				isRunning: false,
				percentage: 0,
				initialFullSyncFinished: 0,
				hasStoreData: true,
			} )
		).toBe( false );
	} );

	it( 'is not stalled when complete', () => {
		expect(
			isSyncStalled( {
				isStarted: true,
				isRunning: false,
				percentage: 100,
				initialFullSyncFinished: 1_700_000_000,
				hasStoreData: true,
			} )
		).toBe( false );
	} );
} );
