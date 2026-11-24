import {
	flowReducer,
	getGuideTrail,
	getInitialFlowState,
	getOption,
	getOptions,
	getPath,
	getResultAction,
	isResultStep,
} from '../steps';
import type { FlowContext, FlowState, GuideAnswerId, OptionId } from '../steps';

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

	it( 'keeps a statement the guide reached from being changed', () => {
		const concluded = guide( ctx, [ 'forwards' ] );

		expect( flowReducer( concluded, { type: 'pick', option: 'original' } ) ).toBe( concluded );
	} );
} );

/**
 * Opens the guide, answers its questions, then answers the main-flow questions that follow.
 *
 * @param flowCtx - The flow context.
 * @param answers - The guide answers.
 * @param picks   - The answers after the guide's statement, if any.
 * @return The flow state at the end.
 */
function guide(
	flowCtx: FlowContext,
	answers: GuideAnswerId[],
	picks: OptionId[] = []
): FlowState {
	let state = answers.reduce(
		( current, id ) => flowReducer( current, { type: 'answer', answer: id } ),
		flowReducer( getInitialFlowState( flowCtx ), { type: 'open-guide', ctx: flowCtx } )
	);
	for ( const option of picks ) {
		state = flowReducer( flowReducer( state, { type: 'next' } ), { type: 'pick', option } );
	}
	return state;
}

/**
 * The action the flow would run from here.
 *
 * @param state - The flow state.
 * @return The action, or null when the step only moves on.
 */
function actionAt( state: FlowState ) {
	if ( isResultStep( state.step ) ) {
		return getResultAction( state.step );
	}
	const option = getOption( state.step, state.pick );
	return option && 'action' in option ? option.action : null;
}

describe( 'Safe Mode step-by-step guide', () => {
	it.each( [
		[ [ 'forwards' ], [], 'main', 'migrate', 'guide>forwards>old' ],
		[ [ 'nothing', 'was_there' ], [], 'main', 'migrate', 'guide>nothing>was_there>old' ],
		[ [ 'nothing', 'not_there' ], [], 'ask', 'confirm-safe-mode', 'guide>nothing>not_there' ],
		[ [ 'loads', 'same' ], [], 'two-addresses', 'confirm-safe-mode', 'guide>loads>same' ],
		[ [ 'loads', 'unsure' ], [], 'ask', 'confirm-safe-mode', 'guide>loads>unsure' ],
		[
			[ 'loads', 'separate', 'unsure' ],
			[],
			'ask',
			'confirm-safe-mode',
			'guide>loads>separate>unsure',
		],
		[
			[ 'loads', 'separate', 'z' ],
			[ 'safe' ],
			'copy',
			'confirm-safe-mode',
			'guide>loads>separate>z>original>safe',
		],
		[
			[ 'loads', 'separate', 'x' ],
			[ 'yes' ],
			'replaced',
			'start-fresh',
			'guide>loads>separate>x>copyof>yes',
		],
	] as const )(
		'answers %j then %j end on %s, which runs %s with path %s',
		( answers, picks, step, action, path ) => {
			const state = guide( ctx, [ ...answers ], [ ...picks ] );

			expect( state.step ).toBe( step );
			expect( actionAt( state ) ).toBe( action );
			expect( getPath( state, ctx ) ).toBe( path );
		}
	);

	it( 'Back undoes one step at a time, back to the first screen', () => {
		const visited: FlowState[] = [ getInitialFlowState( ctx ) ];
		const changes = [
			{ type: 'open-guide', ctx },
			{ type: 'answer', answer: 'loads' },
			{ type: 'answer', answer: 'separate' },
			{ type: 'answer', answer: 'z' },
			{ type: 'next' },
		] as const;
		for ( const change of changes ) {
			visited.push( flowReducer( visited[ visited.length - 1 ], change ) );
		}

		let state = visited[ visited.length - 1 ];
		for ( const expected of visited.slice( 0, -1 ).reverse() ) {
			state = flowReducer( state, { type: 'back' } );
			expect( state ).toEqual( expected );
		}
	} );

	it( '"Stay in Safe Mode for now" leaves the path as it is, and Back returns to the question', () => {
		const question = guide( ctx, [ 'loads' ] );
		const later = flowReducer( question, { type: 'later' } );

		expect( later.step ).toBe( 'later' );
		expect( actionAt( later ) ).toBe( 'confirm-safe-mode' );
		expect( getPath( later, ctx ) ).toBe( getPath( question, ctx ) );
		expect( flowReducer( later, { type: 'back' } ) ).toEqual( question );
		expect( flowReducer( later, { type: 'later' } ) ).toBe( later );
		expect( flowReducer( getInitialFlowState( ctx ), { type: 'later' } ) ).toEqual(
			getInitialFlowState( ctx )
		);
	} );

	it( 'lists the guide answers so far, each pointing at its question', () => {
		const state = guide( ctx, [ 'loads', 'separate', 'z' ], [ 'safe' ] );

		expect( getGuideTrail( state ) ).toEqual( [
			{ index: 1, answer: 'loads' },
			{ index: 2, answer: 'separate' },
			{ index: 3, answer: 'z' },
		] );
		expect( getGuideTrail( answer( ctx, [ 'original', 'safe' ] ) ) ).toEqual( [] );
	} );

	it( 'jumps back to any earlier step as if Back were pressed until there', () => {
		const state = guide( ctx, [ 'loads', 'separate', 'z' ], [ 'safe' ] );

		state.history.forEach( ( _, index ) => {
			let backed = state;
			while ( backed.history.length > index ) {
				backed = flowReducer( backed, { type: 'back' } );
			}
			expect( flowReducer( state, { type: 'back-to', index } ) ).toEqual( backed );
		} );
		for ( const index of [ -1, state.history.length, 1.5 ] ) {
			expect( flowReducer( state, { type: 'back-to', index } ) ).toBe( state );
		}
	} );
} );
