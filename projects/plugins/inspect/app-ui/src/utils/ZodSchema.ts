import { z } from 'zod';
import { jsonSchema } from '../../../packages/Async_Option/scripts/utils';

export const RequestMethods = z.enum( [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD' ] );

export const RequestArgs = z.object( {
	method: RequestMethods,
	timeout: z.number(),
	redirection: z.number(),
	httpversion: z.string(),
	'user-agent': z.string(),
	reject_unsafe_urls: z.boolean(),
	blocking: z.boolean(),
	headers: jsonSchema,
	cookies: z.array( z.string() ),
	body: z.union( [ z.string(), jsonSchema ] ),
	compress: z.boolean(),
	decompress: z.boolean(),
	sslverify: z.boolean(),
	sslcertificates: z.string(),
	stream: z.boolean(),
	filename: z.string().nullable(),
	limit_response_size: z.string().or( z.number() ).nullable(),
	_redirection: z.number(),
} );

export const Incoming = z.object( {
	request: z.object( {
		method: RequestMethods,
		query: jsonSchema,
		body: z.string().or( jsonSchema ),
		headers: jsonSchema,
	} ),
	response: jsonSchema,
} );

export const RequestError = z.object( {
	args: RequestArgs,
	duration: z.number(),
	error: z.object( {
		errors: z.record( z.array( z.string() ) ),
		error_data: z.array( z.unknown() ),
	} ),
} );

export const Outgoing = z.object( {
	args: RequestArgs,
	duration: z.number(),
	response: z.object( {
		headers: jsonSchema,
		body: z.string(),
		response: z.object( {
			code: z.number().or( z.string() ).or( z.null() ).or( z.boolean() ),
			message: z.string(),
		} ),
		cookies: z.array( z.string() ),
		filename: z.string().nullable(),
		http_response: z.object( {
			data: z.string().nullable(),
			headers: jsonSchema,
			status: z.number().nullable(),
		} ),
	} ),
} );

export const LogEntry = z.object( {
	id: z.number(),
	date: z.string(),
	url: z.string(),
	observer_incoming: Incoming.optional(),
	wp_error: RequestError.optional(),
	observer_outgoing: Outgoing.optional(),
} );

export const EntryData = z.object( {
	method: RequestMethods,
	url: z.string().url(),
	headers: jsonSchema,
	body: z.union( [ jsonSchema, z.string().nullable() ] ),
	transport: z.enum( [ 'wp', 'jetpack_connection' ] ),
} );

export const LogEntries = z.array( LogEntry );

export type RequestArgs = z.infer< typeof RequestArgs >;
export type LogEntry = z.infer< typeof LogEntry >;
export type LogEntries = z.infer< typeof LogEntries >;
export type EntryData = z.infer< typeof EntryData >;

export type OutgoingDetails = z.infer< typeof Outgoing >;
export type IncomingDetails = z.infer< typeof Incoming >;
export type OutgoingError = z.infer< typeof RequestError >;
export type LogType = 'inbound_rest_request' | 'wp_error' | 'outbound_request';
