import { toSyncStatus, isSyncComplete, isSyncStalled } from './status';

describe( 'toSyncStatus', () => {
	it( 'reports not-started when the sync has never run', () => {
		const status = toSyncStatus( { started: false }, 0 );
		expect( status ).toEqual( {
			isStarted: false,
			isRunning: false,
			percentage: 0,
			initialFullSyncFinished: 0,
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

describe( 'isSyncComplete', () => {
	it( 'is complete when the milestone is set', () => {
		expect(
			isSyncComplete( {
				isStarted: false,
				isRunning: false,
				percentage: 100,
				initialFullSyncFinished: 1_700_000_000,
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
			} )
		).toBe( false );
	} );

	it( 'is not stalled while finishing — 100% progress with the milestone write still in flight', () => {
		// A poll can read `finished: true` before the milestone is persisted; that
		// surfaces as 100% progress with the milestone unset. The sync is finishing,
		// not stalled, and resolves on the next poll.
		expect(
			isSyncStalled( {
				isStarted: true,
				isRunning: false,
				percentage: 100,
				initialFullSyncFinished: 0,
			} )
		).toBe( false );
	} );

	it( 'stays stalled when finished below 100% (a genuine stall, not the read gap)', () => {
		expect(
			isSyncStalled( {
				isStarted: true,
				isRunning: false,
				percentage: 50,
				initialFullSyncFinished: 0,
			} )
		).toBe( true );
	} );
} );
