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
} );

export const LcpErrorDetailsSchema = z.object( {
	// Adding a generic string type to handle the case where the error type is not in the enum, so the schema is still valid.
	type: z.union( [ LcpErrorTypeSchema, z.string() ] ),
	meta: LcpErrorMetaSchema.optional(),
} );

export const PageSchema = z.object( {
	// Unique page key
	key: z.coerce.string(),
	// Page URL
	url: z.coerce.string(),
	// Status
	status: z.enum( [ 'success', 'pending', 'error' ] ).catch( 'pending' ),
	// Error details
	errors: z.array( LcpErrorDetailsSchema ).optional(),
} );

export const LcpStateSchema = z
	.object( {
		// Pages to optimize
		pages: z.array( PageSchema ),
		status: z.enum( [ 'not_analyzed', 'pending', 'analyzed', 'error' ] ),
		created: z.coerce.number().optional(),
		updated: z.coerce.number().optional(),
	} )
	.catch( {
		pages: [],
		status: 'not_analyzed',
		created: 0,
		updated: 0,
	} );

/**
 * Infer Zod Types
 */
export type LcpState = z.infer< typeof LcpStateSchema >;
export type LcpErrorType = z.infer< typeof LcpErrorType >;
export type LcpErrorTypeSchema = z.infer< typeof LcpErrorTypeSchema >;
export type LcpErrorMeta = z.infer< typeof LcpErrorMetaSchema >;
export type LcpErrorDetails = z.infer< typeof LcpErrorDetailsSchema >;
