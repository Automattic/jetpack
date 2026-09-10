/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { createReduxStore, dispatch, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	AGENTS_MANAGER_READY_EVENT,
	useIsWordPressAgentChatVisible,
	resumeWordPressAgentChat,
	setWordPressAgentChatOpen,
	useIsWordPressAgentReady,
} from '../open-agent';

type AgentsManagerActionsMock = {
	isReady?: boolean;
	setChatOpen?: jest.Mock;
	resumeChat?: jest.Mock;
};

const setAgentsManagerActions = ( actions: AgentsManagerActionsMock | undefined ) => {
	(
		window as unknown as { __agentsManagerActions?: AgentsManagerActionsMock }
	 ).__agentsManagerActions = actions;
};

const announceAgentsManagerReady = () =>
	act( () => {
		window.dispatchEvent( new Event( AGENTS_MANAGER_READY_EVENT ) );
	} );

describe( 'setWordPressAgentChatOpen', () => {
	afterEach( () => setAgentsManagerActions( undefined ) );

	it( 'opens the chat', () => {
		const setChatOpen = jest.fn();
		setAgentsManagerActions( { isReady: true, setChatOpen } );

		setWordPressAgentChatOpen( true );

		expect( setChatOpen ).toHaveBeenCalledWith( true );
	} );

	it( 'closes the chat', () => {
		const setChatOpen = jest.fn();
		setAgentsManagerActions( { isReady: true, setChatOpen } );

		setWordPressAgentChatOpen( false );

		expect( setChatOpen ).toHaveBeenCalledWith( false );
	} );

	it( 'does nothing when the Agents Manager exposes no actions', () => {
		setAgentsManagerActions( undefined );

		expect( () => setWordPressAgentChatOpen( true ) ).not.toThrow();
	} );

	it( 'does nothing when the Agents Manager exposes no open action', () => {
		setAgentsManagerActions( { isReady: true } );

		expect( () => setWordPressAgentChatOpen( true ) ).not.toThrow();
	} );
} );

describe( 'resumeWordPressAgentChat', () => {
	afterEach( () => setAgentsManagerActions( undefined ) );

	it( 'sends the chat back to its default screen', () => {
		const resumeChat = jest.fn();
		setAgentsManagerActions( { isReady: true, resumeChat } );

		resumeWordPressAgentChat();

		expect( resumeChat ).toHaveBeenCalled();
	} );

	it( 'does nothing when the Agents Manager exposes no resume action', () => {
		setAgentsManagerActions( { isReady: true } );

		expect( () => resumeWordPressAgentChat() ).not.toThrow();
	} );
} );

describe( 'useIsWordPressAgentReady', () => {
	afterEach( () => setAgentsManagerActions( undefined ) );

	it( 'reports the Agents Manager as ready when it loaded first', () => {
		setAgentsManagerActions( { isReady: true, setChatOpen: jest.fn() } );

		const { result } = renderHook( () => useIsWordPressAgentReady() );

		expect( result.current ).toBe( true );
	} );

	it( 'reports the Agents Manager as absent until it announces itself', () => {
		setAgentsManagerActions( undefined );

		const { result } = renderHook( () => useIsWordPressAgentReady() );
		expect( result.current ).toBe( false );

		setAgentsManagerActions( { isReady: true, setChatOpen: jest.fn() } );
		announceAgentsManagerReady();

		expect( result.current ).toBe( true );
	} );

	it( 'stays absent when the ready event arrives without usable actions', () => {
		setAgentsManagerActions( undefined );

		const { result } = renderHook( () => useIsWordPressAgentReady() );
		announceAgentsManagerReady();

		expect( result.current ).toBe( false );
	} );

	it( 'stops listening once unmounted, so editors do not leak listeners', () => {
		setAgentsManagerActions( undefined );
		const addListener = jest.spyOn( window, 'addEventListener' );
		const removeListener = jest.spyOn( window, 'removeEventListener' );

		const { unmount } = renderHook( () => useIsWordPressAgentReady() );
		const [ , subscribed ] = addListener.mock.calls.find(
			( [ event ] ) => event === AGENTS_MANAGER_READY_EVENT
		)!;

		unmount();

		expect( removeListener ).toHaveBeenCalledWith( AGENTS_MANAGER_READY_EVENT, subscribed );
		addListener.mockRestore();
		removeListener.mockRestore();
	} );
} );

// Stands in for the store the Agents Manager registers when it loads.
const chatStore = createReduxStore( 'automattic/agents-manager', {
	reducer: ( state = { isOpen: false, isMinimized: false }, action ) =>
		action.type === 'SET' ? action.state : state,
	actions: {
		set: ( state: { isOpen: boolean; isMinimized: boolean } ) => ( { type: 'SET', state } ),
	},
	selectors: {
		getIsOpen: ( state: { isOpen: boolean } ) => state.isOpen,
		getIsMinimized: ( state: { isMinimized: boolean } ) => state.isMinimized,
	},
} );
register( chatStore );

const setChatState = ( state: { isOpen: boolean; isMinimized: boolean } ) =>
	act( () => {
		dispatch( chatStore ).set( state );
	} );

describe( 'useIsWordPressAgentChatVisible', () => {
	afterEach( () => setChatState( { isOpen: false, isMinimized: false } ) );

	it( 'reports the chat as hidden while it is closed', () => {
		const { result } = renderHook( () => useIsWordPressAgentChatVisible() );

		expect( result.current ).toBe( false );
	} );

	it( 'follows the chat opening, without a re-render of its own', () => {
		const { result } = renderHook( () => useIsWordPressAgentChatVisible() );

		setChatState( { isOpen: true, isMinimized: false } );

		expect( result.current ).toBe( true );
	} );

	it( 'follows the chat closing again, which a one-off read would miss', () => {
		const { result } = renderHook( () => useIsWordPressAgentChatVisible() );
		setChatState( { isOpen: true, isMinimized: false } );

		setChatState( { isOpen: false, isMinimized: false } );

		expect( result.current ).toBe( false );
	} );

	it( 'reports a minimised chat as hidden, since the reader cannot see it', () => {
		const { result } = renderHook( () => useIsWordPressAgentChatVisible() );

		setChatState( { isOpen: true, isMinimized: true } );

		expect( result.current ).toBe( false );
	} );
} );
