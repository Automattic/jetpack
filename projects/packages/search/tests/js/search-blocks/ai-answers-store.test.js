/**
 * Tests for the AI Answers slice of the shared Search blocks store: state
 * derivation, the brief-fetch action's same-query memo, the abort-on-clear
 * path, and the brief → extended hand-off.
 */

// Capture the store config the way the existing store.test.js does so we can
// drive its actions / read its state from the test runtime.
const captured = {
	state: {},
	actions: {},
	callbacks: {},
	context: {},
};

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					Object.defineProperty( captured.state, key, descriptors[ key ] );
				}
				Object.assign( captured.actions, config.actions || {} );
				Object.assign( captured.callbacks, config.callbacks || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => captured.context,
		getElement: () => ( { ref: null } ),
	} ),
	{ virtual: true }
);

// Mock the SSE module so no real network calls are made — capture every
// invocation so the test can inspect arguments and fire fake events back
// through the callbacks.
const mockStreamAiAnswer = jest.fn();
jest.mock( '../../../src/search-blocks/store/ai-stream', () => ( {
	streamAiAnswer: ( ...args ) => mockStreamAiAnswer( ...args ),
} ) );

import { actions, state } from '../../../src/search-blocks/store';

/**
 * Pull the args object the store handed to the most recent SSE call so the
 * test can fire fake events back through the callbacks it captured.
 *
 * @return {object} Args of the most recent `streamAiAnswer` invocation.
 */
function lastStreamCall() {
	return mockStreamAiAnswer.mock.calls.at( -1 )[ 0 ];
}

describe( 'AI Answers store slice', () => {
	beforeEach( () => {
		mockStreamAiAnswer.mockReset();
		state.searchQuery = '';
		state.siteId = 42;
		state.locale = 'en-US';
		state.homeUrl = 'https://example.com';
		state.activeFilters = {};
		actions.fetchAiAnswer();
		mockStreamAiAnswer.mockReset();
		// Reset slice manually after the bail-on-short-query reset above.
		state.aiBriefStatus = 'idle';
		state.aiBriefText = '';
		state.aiBriefCitations = [];
		state.aiBriefError = null;
		state.aiExtendedStatus = 'idle';
		state.aiExtendedText = '';
		state.aiExtendedCitations = [];
		state.aiExtendedError = null;
		state.aiExtendedLoadingText = '';
		state.aiShowExtended = false;
		state.aiSessionId = null;
	} );

	it( 'aiPanelHidden is true when status is idle', () => {
		state.aiBriefStatus = 'idle';
		expect( state.aiPanelHidden ).toBe( true );
	} );

	it( 'aiPanelHidden is false once a fetch is in flight', () => {
		state.aiBriefStatus = 'loading';
		expect( state.aiPanelHidden ).toBe( false );
	} );

	it( 'visible-* getters hold the brief while extended is still loading/streaming, then swap on done', () => {
		state.aiBriefText = 'short';
		state.aiBriefCitations = [ { title: 'A', url: 'https://a' } ];
		state.aiBriefStatus = 'done';
		state.aiExtendedText = 'long';
		state.aiExtendedCitations = [ { title: 'B', url: 'https://b' } ];
		state.aiExtendedStatus = 'loading';

		// Pre-click: brief drives the visible slice.
		expect( state.aiVisibleText ).toBe( 'short' );
		expect( state.aiVisibleStatus ).toBe( 'done' );
		expect( state.aiVisibleCitations[ 0 ].title ).toBe( 'A' );

		// User clicks Show more → extended is loading, but the panel must
		// keep showing the brief so it doesn't collapse to a "Finding an
		// answer" placeholder (the bug that prompted this test).
		state.aiShowExtended = true;
		expect( state.aiVisibleText ).toBe( 'short' );
		expect( state.aiVisibleStatus ).toBe( 'done' );
		expect( state.aiVisibleCitations[ 0 ].title ).toBe( 'A' );

		// Extended now streaming — still brief content, status still done.
		state.aiExtendedStatus = 'streaming';
		expect( state.aiVisibleText ).toBe( 'short' );
		expect( state.aiVisibleStatus ).toBe( 'done' );

		// Extended finishes — one clean swap to the longer answer.
		state.aiExtendedStatus = 'done';
		expect( state.aiVisibleText ).toBe( 'long' );
		expect( state.aiVisibleStatus ).toBe( 'done' );
		expect( state.aiVisibleCitations[ 0 ].title ).toBe( 'B' );
	} );

	it( 'aiVisibleStatus surfaces an extended error immediately rather than masking it with the brief', () => {
		state.aiBriefText = 'short';
		state.aiBriefStatus = 'done';
		state.aiShowExtended = true;
		state.aiExtendedError = { message: 'Bad Gateway', code: 502, source: 'http' };
		state.aiExtendedStatus = 'error';
		expect( state.aiVisibleStatus ).toBe( 'error' );
		expect( state.aiVisibleError.code ).toBe( 502 );
	} );

	it( 'aiVisibleCitations marks non-http hrefs as `#` so a bad URL never lands on a `data-wp-bind--href`', () => {
		state.aiBriefCitations = [
			{ title: 'Safe', url: 'https://example.com/safe' },
			{ title: 'Sketchy', url: 'javascript:alert(1)' },
		];
		state.aiBriefStatus = 'done';
		const list = state.aiVisibleCitations;
		expect( list[ 0 ].href ).toBe( 'https://example.com/safe' );
		expect( list[ 1 ].href ).toBe( '#' );
	} );

	it( 'fetchAiAnswer bails when query is shorter than 3 characters', () => {
		state.searchQuery = 'ai';
		actions.fetchAiAnswer();
		expect( mockStreamAiAnswer ).not.toHaveBeenCalled();
	} );

	it( 'fetchAiAnswer dedups when called twice for the same query', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		actions.fetchAiAnswer();
		expect( mockStreamAiAnswer ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'fetchAiAnswer streams updates state.aiBriefStatus and aiBriefText', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		const call = lastStreamCall();
		expect( call.format ).toBe( 'brief' );
		expect( state.aiBriefStatus ).toBe( 'loading' );

		call.onDelta( 'Hello ' );
		expect( state.aiBriefStatus ).toBe( 'streaming' );
		expect( state.aiBriefText ).toBe( 'Hello ' );

		call.onDelta( 'world.' );
		expect( state.aiBriefText ).toBe( 'Hello world.' );

		call.onDone( [ { title: 'Source A', url: 'https://example.com/a' } ] );
		expect( state.aiBriefStatus ).toBe( 'done' );
		expect( state.aiBriefCitations ).toHaveLength( 1 );
	} );

	it( 'fetchAiAnswer routes errors to state.aiBriefError', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		const call = lastStreamCall();
		call.onError( { message: 'Bad Gateway', code: 502, source: 'http' } );
		expect( state.aiBriefStatus ).toBe( 'error' );
		expect( state.aiBriefError ).toEqual( {
			message: 'Bad Gateway',
			code: 502,
			source: 'http',
		} );
	} );

	it( 'fetchAiAnswer captures the session ID for the extended follow-up', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		lastStreamCall().onSessionId( 'sess-123' );
		expect( state.aiSessionId ).toBe( 'sess-123' );
	} );

	it( 'showExtendedAiAnswer kicks off a second stream with the captured sessionId', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		const briefCall = lastStreamCall();
		briefCall.onSessionId( 'sess-xyz' );
		briefCall.onDone( [] );
		expect( state.aiBriefStatus ).toBe( 'done' );

		actions.showExtendedAiAnswer();
		const extendedCall = lastStreamCall();
		expect( extendedCall.format ).toBe( 'extended' );
		expect( extendedCall.sessionId ).toBe( 'sess-xyz' );
		expect( state.aiShowExtended ).toBe( true );
		expect( state.aiExtendedStatus ).toBe( 'loading' );
		expect( typeof state.aiExtendedLoadingText ).toBe( 'string' );
		expect( state.aiExtendedLoadingText.length ).toBeGreaterThan( 0 );
		// Strip the trailing ellipsis — the animated dots after the text
		// already signal "in progress".
		expect( state.aiExtendedLoadingText ).not.toMatch( /…\s*$/ );
		expect( state.aiExtendedLoadingText ).not.toMatch( /\.{3}\s*$/ );
	} );

	it( 'showExtendedAiAnswer falls back to a curated hint set when the seed is missing', () => {
		state.searchQuery = 'tabby cats';
		state.aiExtendedLoadingHints = undefined;
		actions.fetchAiAnswer();
		const briefCall = lastStreamCall();
		briefCall.onDone( [] );
		actions.showExtendedAiAnswer();
		// Even with the JS-side fallback (which keeps the ellipsis in the
		// source string for the overlay's separate use), the picked hint
		// must be trimmed.
		expect( state.aiExtendedLoadingText.length ).toBeGreaterThan( 0 );
		expect( state.aiExtendedLoadingText ).not.toMatch( /…\s*$/ );
	} );

	it( 'showExtendedAiAnswer is a no-op until the brief response has finished', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		mockStreamAiAnswer.mockReset();
		actions.showExtendedAiAnswer();
		expect( mockStreamAiAnswer ).not.toHaveBeenCalled();
		expect( state.aiShowExtended ).toBe( false );
	} );

	it( 'aiShowExtendedButton is true only when brief is done and extended has not started', () => {
		state.aiBriefStatus = 'streaming';
		expect( state.aiShowExtendedButton ).toBe( false );
		state.aiBriefStatus = 'done';
		expect( state.aiShowExtendedButton ).toBe( true );
		state.aiShowExtended = true;
		expect( state.aiShowExtendedButton ).toBe( false );
	} );

	it( 'aiErrorCodeText formats the code with the localized template', () => {
		state.strings = { aiErrorCode: 'Error code: %s' };
		state.aiBriefStatus = 'error';
		state.aiBriefError = { message: 'Bad Gateway', code: 502, source: 'http' };
		expect( state.aiErrorCodeText ).toBe( 'Error code: 502' );
		expect( state.aiHasErrorCode ).toBe( true );
	} );

	it( 'aiHasErrorCode is false when the agent returns no numeric code', () => {
		state.aiBriefStatus = 'error';
		state.aiBriefError = { message: 'Network request error', code: null, source: 'network' };
		expect( state.aiHasErrorCode ).toBe( false );
		expect( state.aiHasErrorDetail ).toBe( true );
	} );

	it( 'clearing the query mid-stream resets the panel state', () => {
		state.searchQuery = 'tabby cats';
		actions.fetchAiAnswer();
		lastStreamCall().onDelta( 'partial' );
		expect( state.aiBriefStatus ).toBe( 'streaming' );

		state.searchQuery = '';
		actions.fetchAiAnswer();

		expect( state.aiBriefStatus ).toBe( 'idle' );
		expect( state.aiBriefText ).toBe( '' );
	} );
} );
