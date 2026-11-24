import {
	flowReducer,
	getInitialFlowState,
	getOption,
	getOptions,
	getPath,
	getResultAction,
} from '../steps';
import type { FlowContext, FlowState, OptionId } from '../steps';

const ctx: FlowContext = {
	isDevelopmentSite: false,
	possibleDynamicSiteUrlDetected: false,
	isStore: false,
	hasJetpackPlugin: true,
};

/**
 * Answers each question in turn, moving on after every answer but the last.
 *
 * @param flowCtx - The flow context.
 * @param picks   - The answers.
 * @return The flow state at the last answer.
 */
function answer( flowCtx: FlowContext, picks: OptionId[] ): FlowState {
	return picks.reduce( ( state, option, index ) => {
		const picked = flowReducer( state, { type: 'pick', option } );
		return index < picks.length - 1 ? flowReducer( picked, { type: 'next' } ) : picked;
	}, getInitialFlowState( flowCtx ) );
}

describe( 'Safe Mode flow steps', () => {
	it.each( [
		[ false, [ 'old' ], 'migrate', 'old' ],
		[ false, [ 'original', 'safe' ], 'confirm-safe-mode', 'original>safe' ],
		[ false, [ 'original', 'fresh' ], 'start-fresh', 'original>fresh' ],
		[ false, [ 'copyof', 'yes' ], 'start-fresh', 'copyof>yes' ],
		[ false, [ 'copyof', 'no' ], 'migrate', 'copyof>no' ],
		[ false, [ 'copyof', 'unsure' ], 'confirm-safe-mode', 'copyof>unsure' ],
		[ true, [ 'safe' ], 'confirm-safe-mode', 'detected_copy>safe' ],
		[ true, [ 'fresh' ], 'start-fresh', 'detected_copy>fresh' ],
	] as const )(
		'development site %s, answers %j run %s with path %s',
		( isDevelopmentSite, picks, action, path ) => {
			const flowCtx = { ...ctx, isDevelopmentSite };
			const state = answer( flowCtx, [ ...picks ] );

			expect( getOption( state.step, state.pick ) ).toMatchObject( { action } );
			expect( getPath( state, flowCtx ) ).toBe( path );
		}
	);

	it.each( [ true, false ] )(
		'offers "same" first only when a dynamic address is detected: %s',
		possibleDynamicSiteUrlDetected => {
			const ids = getOptions( 'main', { ...ctx, possibleDynamicSiteUrlDetected } ).map(
				option => option.id
			);

			expect( ids[ 0 ] === 'same' ).toBe( possibleDynamicSiteUrlDetected );
			expect( ids.includes( 'same' ) ).toBe( possibleDynamicSiteUrlDetected );
		}
	);

	it( '"same" leads to the two-addresses result, which stays in Safe Mode, and Back restores it', () => {
		const flowCtx = { ...ctx, possibleDynamicSiteUrlDetected: true };
		const picked = answer( flowCtx, [ 'same' ] );
		const result = flowReducer( picked, { type: 'next' } );

		expect( result ).toMatchObject( { step: 'two-addresses', pick: null } );
		expect( getResultAction( 'two-addresses' ) ).toBe( 'confirm-safe-mode' );
		expect( getPath( result, flowCtx ) ).toBe( 'same' );
		expect( flowReducer( result, { type: 'back' } ) ).toEqual( picked );
	} );
} );
