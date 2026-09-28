import { getVideoRatio, observeVideoRatio } from '../dimensions';
import type { PlayerApi } from '../loader';

describe( 'getVideoRatio', () => {
	it( 'returns portrait, landscape and square percentages', () => {
		expect( getVideoRatio( { width: 1080, height: 1920 } ) ).toBeCloseTo( 177.7778 );
		expect( getVideoRatio( { width: 1920, height: 1080 } ) ).toBe( 56.25 );
		expect( getVideoRatio( { width: 500, height: 500 } ) ).toBe( 100 );
	} );
	it.each( [
		null,
		{},
		{ width: 0, height: 20 },
		{ width: 10, height: -1 },
		{ width: '10', height: 20 },
		{ width: Infinity, height: 10 },
		{ width: Number.MIN_VALUE, height: Number.MAX_VALUE },
	] )( 'rejects unusable dimensions: %p', dimensions => {
		expect( getVideoRatio( dimensions ) ).toBeNull();
	} );
} );

describe( 'observeVideoRatio', () => {
	let info: NonNullable< PlayerApi[ 'info' ] >;
	let onChange: ( dimensions: { width: number; height: number } ) => void;
	let resolveDimensions: ( dimensions: { width: number; height: number } | null ) => void;
	const callback = jest.fn();
	const api = () => ( { info } ) as PlayerApi;

	beforeEach( () => {
		callback.mockClear();
		info = {
			dimensions: () =>
				new Promise( resolve => {
					resolveDimensions = resolve;
				} ),
			onDimensionsChanged: cb => {
				onChange = cb;
				return 'subscription';
			},
			offDimensionsChanged: jest.fn(),
		};
	} );

	it( 'recovers an announcement missed before subscribing and follows later changes', async () => {
		const stop = observeVideoRatio( api(), callback );
		resolveDimensions( { width: 1920, height: 1080 } );
		await Promise.resolve();
		expect( callback ).toHaveBeenLastCalledWith( 56.25 );
		onChange( { width: 1080, height: 1920 } );
		expect( callback ).toHaveBeenLastCalledWith( ( 1920 / 1080 ) * 100 );
		stop();
		expect( info.offDimensionsChanged ).toHaveBeenCalledWith( 'subscription' );
	} );

	it( 'does not let a delayed initial read overwrite a newer event', async () => {
		observeVideoRatio( api(), callback );
		onChange( { width: 1080, height: 1920 } );
		resolveDimensions( { width: 1920, height: 1080 } );
		await Promise.resolve();
		expect( callback ).toHaveBeenCalledTimes( 1 );
		expect( callback ).toHaveBeenCalledWith( ( 1920 / 1080 ) * 100 );
	} );

	it( 'ignores pending results and events after disposal', async () => {
		const stop = observeVideoRatio( api(), callback );
		stop();
		resolveDimensions( { width: 1920, height: 1080 } );
		onChange( { width: 1080, height: 1920 } );
		await Promise.resolve();
		expect( callback ).not.toHaveBeenCalled();
	} );

	it( 'tolerates older bundles and disabled APIs', () => {
		expect( () => observeVideoRatio( {} as PlayerApi, callback )() ).not.toThrow();
		expect( () => observeVideoRatio( null, callback )() ).not.toThrow();
	} );
} );
