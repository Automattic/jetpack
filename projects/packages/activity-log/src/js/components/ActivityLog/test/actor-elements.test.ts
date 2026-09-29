import { describe, expect, test } from '@jest/globals';
import { ALL_AI_AGENTS_ACTOR_ID, getActorElements } from '../actor-elements';
import type { ActorSummary } from '../types';

const person: ActorSummary = { id: 'wpcom:1', name: 'Todd W', count: 3 };
const mcpClient: ActorSummary = {
	id: 'mcp:anthropicclaudeai',
	name: 'Anthropic/ClaudeAI',
	is_mcp_agent: true,
	count: 2,
};

describe( 'getActorElements', () => {
	test( 'lists "All AI agents" first when an MCP client is in the list', () => {
		expect( getActorElements( [ person, mcpClient ] ) ).toEqual( [
			{ value: ALL_AI_AGENTS_ACTOR_ID, label: 'All AI agents' },
			{ value: 'mcp:anthropicclaudeai', label: 'Anthropic/ClaudeAI (2)' },
			{ value: 'wpcom:1', label: 'Todd W (3)' },
		] );
	} );

	test( 'leaves "All AI agents" out when no MCP client is in the list', () => {
		expect( getActorElements( [ person ] ) ).toEqual( [
			{ value: 'wpcom:1', label: 'Todd W (3)' },
		] );
	} );

	test( 'keeps "All AI agents" while it is the active filter, so the filter pill has a label', () => {
		expect( getActorElements( [ person ], [ ALL_AI_AGENTS_ACTOR_ID ] ) ).toEqual( [
			{ value: ALL_AI_AGENTS_ACTOR_ID, label: 'All AI agents' },
			{ value: 'wpcom:1', label: 'Todd W (3)' },
		] );
	} );

	test( 'returns nothing without actors or an active "All AI agents" filter', () => {
		expect( getActorElements( undefined ) ).toEqual( [] );
	} );

	test( 'skips actors without an ID', () => {
		expect( getActorElements( [ { id: '', name: 'Ghost' } ] ) ).toEqual( [] );
	} );
} );
