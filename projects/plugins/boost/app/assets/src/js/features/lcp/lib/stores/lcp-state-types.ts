import { z } from 'zod';

// TODO: Reflect this in Boost Cloud after Beta release, each one should be an Error type.
export const LcpErrorType = z.enum( [
	'UrlError',
	'HttpError',
	'UnknownError',
	'TimeoutError',
	'OptimizationError',
] );

export const LcpErrorTypeSchema = z.enum( [
	'unknown',
	'element-not-unique',
	'http-error',
	'lcp-timeout',
	'lcp-metric-timeout',
] );

export const LcpErrorMetaSchema = z.object( {
	code: z.number().optional(),
	selector: z.string().optional(),
	// `page-navigated` errors from boost-cloud (BOOST-597) carry the redirect target here.
	finalUrl: z.string().optional(),
} );

/**
 * The server stores an empty error meta as an empty PHP array, which JSON-encodes as `[]`
 * (older/edge payloads may also send `null`). A bare `z.object()` rejects `[]`/`null`, so
 * normalize those empty encodings to `{}` before validating the known meta keys. This keeps
 * a `page-navigated` (or any empty-meta) error from failing its page and, in turn, collapsing
 * every analyzed page to the not_analyzed fallback UI.
 */
const LcpErrorMetaField = z.preprocess(
	value => ( value == null || Array.isArray( value ) ? {} : value ),
	LcpErrorMetaSchema
);

export const LcpErrorDetailsSchema = z
	.object( {
		// Adding a generic string type to handle the case where the error type is not in the enum, so the schema is still valid.
		type: z.union( [ LcpErrorTypeSchema, z.string() ] ),
		meta: LcpErrorMetaField.optional(),
	} )
	// Isolate a single malformed error entry: fall back to a benign `unknown` error rather
	// than throwing, so the page (with its real key/url/status) and all sibling pages survive.
	.catch( { type: 'unknown' } );

export const PageSchema = z
	.object( {
		// Unique page key
		key: z.coerce.string(),
		// Page URL
		url: z.coerce.string(),
		// Status
		status: z.enum( [ 'success', 'pending', 'error' ] ).catch( 'pending' ),
		// Error details
		errors: z.array( LcpErrorDetailsSchema ).optional(),
	} )
	// Isolate a single malformed page so it can't fail the whole pages array. This is what
	// keeps one bad entry from collapsing nine good results into the not_analyzed fallback.
	.catch( { key: '', url: '', status: 'error', errors: [] } );

// No whole-state `.catch()`: resilience now lives at the page and error level (above), so one
// bad page or error entry degrades in place instead of wiping every analyzed result. The server
// schema guarantees the top-level shape and a valid `status`.
export const LcpStateSchema = z.object( {
	// Pages to optimize
	pages: z.array( PageSchema ),
	status: z.enum( [ 'not_analyzed', 'pending', 'analyzed', 'error' ] ),
	created: z.coerce.number().optional(),
	updated: z.coerce.number().optional(),
} );

/**
 * Infer Zod Types
 */
export type LcpState = z.infer< typeof LcpStateSchema >;
export type LcpErrorType = z.infer< typeof LcpErrorType >;
export type LcpErrorTypeSchema = z.infer< typeof LcpErrorTypeSchema >;
export type LcpErrorMeta = z.infer< typeof LcpErrorMetaSchema >;
export type LcpErrorDetails = z.infer< typeof LcpErrorDetailsSchema >;
