import { describe, expect, test } from '@jest/globals';
import { ALL_AI_AGENTS_ACTOR_ID, getActorElements } from '../actor-elements';

const mcpClient = { id: 'mcp:anthropicclaudeai', name: 'Anthropic/ClaudeAI', is_mcp_agent: true };

describe( 'getActorElements', () => {
	test( 'lists "All AI agents" first while that filter is on, so its chip has a label', () => {
		expect( getActorElements( [], true ) ).toEqual( [
			{ value: ALL_AI_AGENTS_ACTOR_ID, label: 'All AI agents' },
		] );
	} );

	test( 'leaves "All AI agents" out while that filter is off, even with MCP clients', () => {
		expect( getActorElements( [ mcpClient ] ) ).toEqual( [
			{ value: 'mcp:anthropicclaudeai', label: 'Anthropic/ClaudeAI' },
		] );
	} );
} );
