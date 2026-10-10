import { expect, test } from '@playwright/test';
import {
	installJetpackAiEvidenceCollector,
	readJetpackAiBrowserEvidence,
	summarizeJetpackAiBrowserEvidence,
} from '../../helpers/jetpack-ai-sidebar-evidence';

// This deterministic helper test intentionally avoids connected-site fixtures.
test( 'The evidence collector reconstructs a streamed tool call', async ( { page } ) => {
	await installJetpackAiEvidenceCollector( page );
	await page.route( 'https://example.test/agent', async route => {
		const events = [
			{
				method: 'message/delta',
				params: {
					delta: {
						deltaType: 'tool_name',
						content: 'wpcom__update_',
						toolCallId: 'call-1',
					},
				},
			},
			{
				method: 'message/delta',
				params: {
					delta: {
						deltaType: 'tool_name',
						content: 'block_content',
						toolCallId: 'call-1',
					},
				},
			},
			{
				method: 'message/delta',
				params: {
					delta: {
						deltaType: 'tool_argument',
						content: '{"clientId":"block-123",',
						toolCallId: 'call-1',
					},
				},
			},
			{
				method: 'message/delta',
				params: {
					delta: {
						deltaType: 'tool_argument',
						content: '"content":"Corrected"}',
						toolCallId: 'call-1',
					},
				},
			},
		];
		await route.fulfill( {
			body: events.map( event => `data: ${ JSON.stringify( event ) }\n\n` ).join( '' ),
			contentType: 'text/event-stream',
			headers: { 'access-control-allow-origin': '*' },
		} );
	} );
	await page.goto( 'about:blank' );
	await page.evaluate( async () => {
		await fetch( 'https://example.test/agent', {
			method: 'POST',
			body: JSON.stringify( { message: 'Check the grammar and spelling of this text' } ),
		} );
		window.dispatchEvent( new Event( 'jetpack-ai-sidebar-block-action-complete' ) );
	} );

	await expect
		.poll( async () => ( await readJetpackAiBrowserEvidence( page ) ).toolCalls )
		.toEqual( [
			{
				id: 'call-1',
				name: 'wpcom__update_block_content',
				arguments: { clientId: 'block-123', content: 'Corrected' },
			},
		] );
	const evidence = await readJetpackAiBrowserEvidence( page );
	expect( evidence.blockActionCompletions ).toBe( 1 );
	expect( evidence.streams ).toEqual( [
		expect.objectContaining( {
			requestMethod: 'POST',
			requestBody: '{"message":"Check the grammar and spelling of this text"}',
		} ),
	] );
	expect( summarizeJetpackAiBrowserEvidence( evidence ) ).toEqual( {
		blockActionCompletions: 1,
		streams: [
			{
				status: 200,
				contentType: 'text/event-stream',
				requestMethod: 'POST',
			},
		],
		toolCalls: [
			{
				name: 'wpcom__update_block_content',
				argumentKeys: [ 'clientId', 'content' ],
			},
		],
	} );
} );
