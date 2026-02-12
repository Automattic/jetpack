import formatSlackMessage from '../src/utils/slack/format-slack-message.ts';
import type { IssuesEvent } from '../src/types.ts';

describe( 'formatSlackMessage', () => {
	const mockPayload: IssuesEvent = {
		issue: {
			html_url: 'https://github.com/Automattic/jetpack/issues/123',
			title: 'Test Issue Title',
		},
	} as unknown as IssuesEvent;

	test( 'returns object with correct channel', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'Hello' );
		expect( result.channel ).toBe( 'C12345' );
	} );

	test( 'includes message in blocks section text', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'A test message' );
		expect( result.blocks ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					type: 'section',
					text: expect.objectContaining( { text: 'A test message' } ),
				} ),
			] )
		);
	} );

	test( 'includes issue link in blocks', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'Hello' );
		expect( result.blocks ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( {
					type: 'section',
					text: expect.objectContaining( {
						text: '<https://github.com/Automattic/jetpack/issues/123|Test Issue Title>',
					} ),
				} ),
			] )
		);
	} );

	test( 'includes a divider block', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'Hello' );
		expect( result.blocks ).toEqual(
			expect.arrayContaining( [ expect.objectContaining( { type: 'divider' } ) ] )
		);
	} );

	test( 'fallback text includes both message and issue link', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'Hello' );
		expect( result.text ).toBe(
			'Hello -- <https://github.com/Automattic/jetpack/issues/123|Test Issue Title>'
		);
	} );

	test( 'disables link unfurling', () => {
		const result = formatSlackMessage( mockPayload, 'C12345', 'Hello' );
		expect( result.unfurl_links ).toBe( false );
		expect( result.unfurl_media ).toBe( false );
	} );
} );
