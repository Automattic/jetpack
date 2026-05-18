jest.mock( '@microsoft/fetch-event-source', () => ( {
	fetchEventSource: jest.fn(),
} ) );

import { fetchEventSource } from '@microsoft/fetch-event-source';
import {
	buildAiAnswerRequestBody,
	createAiAnswersController,
	getAiAnswerDisplayState,
} from '../controller';

const lastFetchOptions = () => fetchEventSource.mock.calls.at( -1 )[ 1 ];
const fireMessage = data => lastFetchOptions().onmessage( { data: JSON.stringify( data ) } );

describe( 'AI Answers controller', () => {
	beforeEach( () => {
		fetchEventSource.mockClear();
		fetchEventSource.mockReturnValue( new Promise( () => {} ) );
	} );

	it( 'builds the AI request body with query, site, filters, and format', () => {
		expect(
			buildAiAnswerRequestBody( {
				query: 'reset password',
				siteId: '123',
				options: { homeUrl: 'https://example.com', locale: 'fr' },
				filters: { category: [ 'docs' ] },
				format: 'brief',
			} ).params.message.parts
		).toEqual( [
			{ type: 'text', text: 'reset password' },
			{
				type: 'data',
				data: {
					clientContext: {
						selectedSiteId: '123',
						site_url: 'https://example.com',
						filters: { category: [ 'docs' ] },
						locale: 'fr',
						aiAnswersFormat: 'brief',
					},
				},
				metadata: {},
			},
		] );
	} );

	it( 'does not request answers for short queries', () => {
		const onUpdate = jest.fn();
		const controller = createAiAnswersController( {
			siteId: '123',
			options: { aiAnswersEnabled: true },
			onUpdate,
		} );

		controller.start( 'hi' );

		expect( fetchEventSource ).not.toHaveBeenCalled();
		expect( onUpdate ).toHaveBeenCalledWith(
			expect.objectContaining( { status: 'idle', text: '' } )
		);
	} );

	it( 'streams brief answers and citations into display state', () => {
		const onUpdate = jest.fn();
		const controller = createAiAnswersController( {
			siteId: '123',
			options: { aiAnswersEnabled: true },
			onUpdate,
		} );

		controller.start( 'reset password' );
		fireMessage( {
			method: 'message/delta',
			params: { delta: { deltaType: 'content', content: 'Use the reset link.' } },
		} );
		fireMessage( {
			result: {
				type: 'TaskStatusUpdateEvent',
				status: {
					state: 'completed',
					message: {
						parts: [
							{
								type: 'data',
								data: { sources: [ { title: 'Reset guide', url: 'https://example.com' } ] },
							},
						],
					},
				},
			},
		} );

		expect( fetchEventSource ).toHaveBeenCalledTimes( 1 );
		expect( JSON.parse( lastFetchOptions().body ).params.message.parts[ 0 ].text ).toBe(
			'reset password'
		);
		expect( onUpdate ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				status: 'done',
				text: 'Use the reset link.',
				citations: [ { title: 'Reset guide', url: 'https://example.com' } ],
				canShowMore: true,
			} )
		);
	} );

	it( 'uses the brief session ID when requesting an extended answer', () => {
		const controller = createAiAnswersController( {
			siteId: '123',
			options: { aiAnswersEnabled: true },
		} );

		controller.start( 'reset password' );
		fireMessage( { result: { sessionId: 'session-1' } } );
		controller.showMore();

		expect( fetchEventSource ).toHaveBeenCalledTimes( 2 );
		const body = JSON.parse( lastFetchOptions().body );
		expect( body.params.sessionId ).toBe( 'session-1' );
		expect( body.params.message.parts[ 1 ].data.clientContext.aiAnswersFormat ).toBe( 'extended' );
	} );
} );

describe( 'getAiAnswerDisplayState', () => {
	it( 'combines brief and extended answer text while extended mode is active', () => {
		expect(
			getAiAnswerDisplayState( {
				briefStatus: 'done',
				briefText: 'Brief.',
				briefCitations: [ { title: 'Brief source' } ],
				briefError: null,
				extendedStatus: 'streaming',
				extendedText: 'Extended.',
				extendedCitations: [],
				extendedError: null,
				extendedLoadingText: '',
				showExtended: true,
			} )
		).toEqual(
			expect.objectContaining( {
				status: 'streaming',
				text: 'Brief.\n\nExtended.',
				citations: [ { title: 'Brief source' } ],
				canShowMore: false,
			} )
		);
	} );
} );
