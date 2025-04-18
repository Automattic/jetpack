import { JSONSchema } from '$lib/utils/json-types';
import z from 'zod';

// @TODO: We don't send this back from the API, but it's here for if we do.
export const LcpErrorType = z.enum( [
	'UrlError',
	'HttpError',
	'UnknownError',
	'TimeoutError',
	'OptimizationError',
] );

export const LcpErrorDetailsSchema = z.object( {
	url: z.coerce.string(),
	message: z.coerce.string(),
	meta: z.record( JSONSchema ).catch( {} ),
	type: LcpErrorType,
} );

export const PageSchema = z.object( {
	// Unique page key
	key: z.coerce.string(),
	// Page URL
	url: z.coerce.string(),
	// Status
	status: z.enum( [ 'success', 'pending', 'error' ] ).catch( 'pending' ),
	// Error details
	// @TODO: We don't send this back from the API, but it's here for if we do.
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
export type LcpErrorDetails = z.infer< typeof LcpErrorDetailsSchema >;
