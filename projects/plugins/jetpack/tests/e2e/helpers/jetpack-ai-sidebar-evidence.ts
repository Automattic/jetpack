/* eslint-disable jsdoc/require-jsdoc */

import type { Page, Response } from '@playwright/test';

export interface JetpackAiToolCall {
	id: string;
	name: string;
	arguments: Record< string, unknown >;
}

export interface JetpackAiStreamCapture {
	url: string;
	status: number;
	contentType: string;
	requestMethod: string;
	requestBody: string;
	body: string;
}

export interface JetpackAiBrowserEvidence {
	blockActionCompletions: number;
	streams: JetpackAiStreamCapture[];
	toolCalls: JetpackAiToolCall[];
}

export interface JetpackAiEvidenceSummary {
	blockActionCompletions: number;
	streams: Array< Pick< JetpackAiStreamCapture, 'status' | 'contentType' | 'requestMethod' > >;
	toolCalls: Array< {
		name: string;
		argumentKeys: string[];
	} >;
}

interface MutableToolCall {
	id: string;
	name: string;
	argumentFragments: string[];
	arguments?: Record< string, unknown >;
}

interface RequestMetadata {
	method: string;
	body: string;
}

interface ActiveStream {
	capture: JetpackAiStreamCapture;
	pendingText: string;
	queuedChunks: string[];
	initialized: boolean;
	loadingFinished: boolean;
}

interface CollectorState {
	streams: JetpackAiStreamCapture[];
	calls: Map< string, MutableToolCall >;
	requests: Map< string, RequestMetadata >;
	activeStreams: Map< string, ActiveStream >;
}

interface FrameEvidence extends JetpackAiBrowserEvidence {
	frameUrl: string;
}

interface NetworkRequestWillBeSentEvent {
	requestId: string;
	request: {
		method: string;
		postData?: string;
	};
}

interface NetworkResponseReceivedEvent {
	requestId: string;
	response: {
		url: string;
		status: number;
		mimeType: string;
		headers: Record< string, string | number >;
	};
}

interface NetworkDataReceivedEvent {
	requestId: string;
	data?: string;
}

interface NetworkLoadingFinishedEvent {
	requestId: string;
}

const collectorByPage = new WeakMap< Page, CollectorState >();

const isRecord = ( value: unknown ): value is Record< string, unknown > =>
	typeof value === 'object' && value !== null;

function firstString( value: Record< string, unknown >, keys: string[] ): string | undefined {
	for ( const key of keys ) {
		const candidate = value[ key ];
		if ( typeof candidate === 'string' ) {
			return candidate;
		}
	}
	return undefined;
}

function getCall( state: CollectorState, id: string, name?: string ): MutableToolCall {
	const partialKey = `${ id }:__partial__`;
	const key = name ? `${ id }:${ name }` : partialKey;
	const existing = state.calls.get( key );
	if ( existing ) {
		return existing;
	}
	const partial = name ? state.calls.get( partialKey ) : undefined;
	if ( partial && ( ! partial.name || partial.name === name ) ) {
		partial.name = name ?? partial.name;
		state.calls.delete( partialKey );
		state.calls.set( key, partial );
		return partial;
	}
	const created: MutableToolCall = { id, name: name ?? '', argumentFragments: [] };
	state.calls.set( key, created );
	return created;
}

function visitToolCallData( state: CollectorState, value: unknown ): void {
	if ( Array.isArray( value ) ) {
		value.forEach( item => visitToolCallData( state, item ) );
		return;
	}
	if ( ! isRecord( value ) ) {
		return;
	}

	const id = firstString( value, [ 'toolCallId', 'tool_call_id' ] );
	if ( id ) {
		const toolName = firstString( value, [ 'toolCallName', 'toolId', 'tool_id' ] );
		const call = getCall( state, id, toolName );
		if ( toolName ) {
			call.name = toolName;
		} else if ( value.deltaType === 'tool_name' && typeof value.content === 'string' ) {
			call.name += value.content;
		}
		if ( value.deltaType === 'tool_argument' && typeof value.content === 'string' ) {
			call.argumentFragments.push( value.content );
		} else if ( isRecord( value.arguments ) ) {
			call.arguments = value.arguments;
		}
	}

	Object.values( value ).forEach( item => visitToolCallData( state, item ) );
}

function parseSseEvent( state: CollectorState, eventText: string ): void {
	const data = eventText
		.split( /\r?\n/ )
		.filter( line => line.startsWith( 'data:' ) )
		.map( line => line.slice( line.startsWith( 'data: ' ) ? 6 : 5 ) )
		.join( '\n' );
	if ( ! data ) {
		return;
	}
	try {
		visitToolCallData( state, JSON.parse( data ) );
	} catch {
		// Ignore incomplete or non-JSON stream events.
	}
}

function consumeSseChunk( state: CollectorState, stream: ActiveStream, chunk: string ): void {
	stream.capture.body += chunk;
	stream.pendingText += chunk;
	const events = stream.pendingText.split( /\r?\n\r?\n/ );
	stream.pendingText = events.pop() ?? '';
	events.forEach( eventText => parseSseEvent( state, eventText ) );
}

function finishStream( state: CollectorState, requestId: string ): void {
	const stream = state.activeStreams.get( requestId );
	if ( stream ) {
		if ( stream.pendingText ) {
			parseSseEvent( state, stream.pendingText );
		}
		state.activeStreams.delete( requestId );
	}
	state.requests.delete( requestId );
}

function readToolCalls( state: CollectorState ): JetpackAiToolCall[] {
	return Array.from( state.calls.values() )
		.filter( call => call.name )
		.map( call => {
			let parsedArguments = call.arguments ?? {};
			if ( ! call.arguments && call.argumentFragments.length > 0 ) {
				try {
					parsedArguments = JSON.parse( call.argumentFragments.join( '' ) );
				} catch {
					parsedArguments = { _raw: call.argumentFragments.join( '' ) };
				}
			}
			return { id: call.id, name: call.name, arguments: parsedArguments };
		} );
}

function getContentType( response: NetworkResponseReceivedEvent[ 'response' ] ): string {
	for ( const [ name, value ] of Object.entries( response.headers ) ) {
		if ( name.toLowerCase() === 'content-type' ) {
			return String( value );
		}
	}
	return response.mimeType;
}

async function installCdpStreamCollector( page: Page, state: CollectorState ): Promise< void > {
	const session = await page.context().newCDPSession( page );
	await session.send( 'Network.enable' );
	session.on( 'Network.requestWillBeSent', ( event: NetworkRequestWillBeSentEvent ) => {
		state.requests.set( event.requestId, {
			method: event.request.method,
			body: event.request.postData ?? '',
		} );
	} );
	session.on( 'Network.responseReceived', ( event: NetworkResponseReceivedEvent ) => {
		const contentType = getContentType( event.response );
		if ( ! contentType.includes( 'text/event-stream' ) ) {
			return;
		}
		const request = state.requests.get( event.requestId );
		const stream: ActiveStream = {
			capture: {
				url: event.response.url,
				status: event.response.status,
				contentType,
				requestMethod: request?.method ?? '',
				requestBody: request?.body ?? '',
				body: '',
			},
			pendingText: '',
			queuedChunks: [],
			initialized: false,
			loadingFinished: false,
		};
		state.streams.push( stream.capture );
		state.activeStreams.set( event.requestId, stream );
		const initializeStream = ( bufferedData?: string ): void => {
			if ( bufferedData ) {
				consumeSseChunk( state, stream, Buffer.from( bufferedData, 'base64' ).toString( 'utf8' ) );
			}
			stream.initialized = true;
			for ( const chunk of stream.queuedChunks ) {
				consumeSseChunk( state, stream, chunk );
			}
			stream.queuedChunks = [];
			if ( stream.loadingFinished ) {
				finishStream( state, event.requestId );
			}
		};
		void session
			.send( 'Network.streamResourceContent', { requestId: event.requestId } )
			.then( result => initializeStream( result.bufferedData ) )
			.catch( () => initializeStream() );
	} );
	session.on( 'Network.dataReceived', ( event: NetworkDataReceivedEvent ) => {
		const stream = state.activeStreams.get( event.requestId );
		if ( stream && event.data ) {
			const chunk = Buffer.from( event.data, 'base64' ).toString( 'utf8' );
			if ( stream.initialized ) {
				consumeSseChunk( state, stream, chunk );
			} else {
				stream.queuedChunks.push( chunk );
			}
		}
	} );
	session.on( 'Network.loadingFinished', ( event: NetworkLoadingFinishedEvent ) => {
		const stream = state.activeStreams.get( event.requestId );
		if ( stream && ! stream.initialized ) {
			stream.loadingFinished = true;
			state.requests.delete( event.requestId );
			return;
		}
		finishStream( state, event.requestId );
	} );
}

async function captureCompletedSseResponse(
	state: CollectorState,
	response: Response
): Promise< void > {
	const contentType = response.headers()[ 'content-type' ] ?? '';
	if ( ! contentType.includes( 'text/event-stream' ) ) {
		return;
	}
	try {
		const body = await response.text();
		const request = response.request();
		const stream: ActiveStream = {
			capture: {
				url: response.url(),
				status: response.status(),
				contentType,
				requestMethod: request.method(),
				requestBody: request.postData() ?? '',
				body: '',
			},
			pendingText: '',
			queuedChunks: [],
			initialized: true,
			loadingFinished: true,
		};
		state.streams.push( stream.capture );
		consumeSseChunk( state, stream, body );
		if ( stream.pendingText ) {
			parseSseEvent( state, stream.pendingText );
		}
	} catch {
		// The CDP collector remains available when response bodies cannot be read.
	}
}

export async function installJetpackAiEvidenceCollector( page: Page ): Promise< void > {
	if ( collectorByPage.has( page ) ) {
		return;
	}
	const state: CollectorState = {
		streams: [],
		calls: new Map(),
		requests: new Map(),
		activeStreams: new Map(),
	};
	collectorByPage.set( page, state );
	try {
		await installCdpStreamCollector( page, state );
	} catch {
		page.on( 'response', response => {
			void captureCompletedSseResponse( state, response );
		} );
	}

	await page.addInitScript( () => {
		type EvidenceWindow = Window & {
			__jetpackAiE2EEvidence?: JetpackAiBrowserEvidence;
		};
		const evidence: JetpackAiBrowserEvidence = {
			blockActionCompletions: 0,
			streams: [],
			toolCalls: [],
		};
		( window as EvidenceWindow ).__jetpackAiE2EEvidence = evidence;
		window.addEventListener( 'jetpack-ai-sidebar-block-action-complete', () => {
			evidence.blockActionCompletions += 1;
		} );
	} );
}

export async function readJetpackAiBrowserEvidence(
	page: Page
): Promise< JetpackAiBrowserEvidence > {
	const frameEvidence = await Promise.all(
		page.frames().map( async ( frame ): Promise< FrameEvidence | null > => {
			try {
				return await frame.evaluate( () => {
					type EvidenceWindow = Window & {
						__jetpackAiE2EEvidence?: JetpackAiBrowserEvidence;
					};
					const evidence = ( window as EvidenceWindow ).__jetpackAiE2EEvidence;
					return evidence ? { ...evidence, frameUrl: window.location.href } : null;
				} );
			} catch {
				return null;
			}
		} )
	);

	const state = collectorByPage.get( page );
	const result: JetpackAiBrowserEvidence = {
		blockActionCompletions: 0,
		streams: state ? [ ...state.streams ] : [],
		toolCalls: state ? readToolCalls( state ) : [],
	};
	for ( const evidence of frameEvidence ) {
		if ( evidence ) {
			result.blockActionCompletions += evidence.blockActionCompletions;
		}
	}
	return result;
}

export function summarizeJetpackAiBrowserEvidence(
	evidence: JetpackAiBrowserEvidence
): JetpackAiEvidenceSummary {
	return {
		blockActionCompletions: evidence.blockActionCompletions,
		streams: evidence.streams.map( stream => ( {
			status: stream.status,
			contentType: stream.contentType,
			requestMethod: stream.requestMethod,
		} ) ),
		toolCalls: evidence.toolCalls.map( toolCall => ( {
			name: toolCall.name,
			argumentKeys: Object.keys( toolCall.arguments ).sort(),
		} ) ),
	};
}
