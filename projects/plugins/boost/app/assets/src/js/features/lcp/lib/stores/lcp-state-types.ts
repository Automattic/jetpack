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

export const LcpErrorDetailsSchema = z
	.object( {
		// Adding a generic string type to handle the case where the error type is not in the enum, so the schema is still valid.
		type: z.union( [ LcpErrorTypeSchema, z.string() ] ),
		// The server stores empty error meta as an empty PHP array (`[]`), and older payloads may
		// send `null`; a bare object schema rejects both. `.catch({})` degrades any unparseable
		// meta (empty array, null, absent, or a malformed known key) to `{}` while preserving the
		// error's real `type`, so a `page-navigated` (or any empty-meta) error can't fail its page
		// and, in turn, collapse every analyzed page to the not_analyzed fallback.
		meta: LcpErrorMetaSchema.catch( {} ),
	} )
	// Isolate a single malformed error entry: fall back to a benign `unknown` error rather
	// than throwing, so the page (with its real key/url/status) and all sibling pages survive.
	// `meta: {}` is required because dropping `.optional()` above makes `meta` a present key in the
	// inferred type, so the fallback object must supply it to satisfy the schema's output contract.
	.catch( { type: 'unknown', meta: {} } );

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

// Resilience against a single bad entry lives at the page and error level (above), so one bad
// page or error degrades in place instead of wiping every analyzed result. The top-level `.catch()`
// only fires for a malformed top-level shape, e.g. the disabled-module optimize response
// `{ success: false, state: [] }` where `state` is `[]`: it keeps that from throwing a ZodError
// before the action's own `success: false` handler can map it to the LCP error state.
export const LcpStateSchema = z
	.object( {
		// Pages to optimize
		pages: z.array( PageSchema ),
		// `.catch()` on the enum so an invalid top-level status degrades in place (mirroring
		// PageSchema.status and the server's own `->fallback('not_analyzed')`) instead of failing
		// the whole object and wiping otherwise-valid pages via the outer `.catch()` below.
		status: z.enum( [ 'not_analyzed', 'pending', 'analyzed', 'error' ] ).catch( 'not_analyzed' ),
		created: z.coerce.number().optional(),
		updated: z.coerce.number().optional(),
	} )
	.catch( { pages: [], status: 'not_analyzed', created: 0, updated: 0 } );

/**
 * Infer Zod Types
 */
export type LcpState = z.infer< typeof LcpStateSchema >;
export type LcpErrorType = z.infer< typeof LcpErrorType >;
export type LcpErrorTypeSchema = z.infer< typeof LcpErrorTypeSchema >;
export type LcpErrorMeta = z.infer< typeof LcpErrorMetaSchema >;
export type LcpErrorDetails = z.infer< typeof LcpErrorDetailsSchema >;
