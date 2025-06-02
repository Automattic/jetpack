import z from 'zod';

// TODO: Reflect this in Boost Cloud after Beta release, each one should be an Error type.
export const LcpErrorType = z.enum( [
	'UrlError',
	'HttpError',
	'UnknownError',
	'TimeoutError',
	'OptimizationError',
] );

export const LcpErrorDetailsSchema = z.object( {
	message: z.coerce.string(),
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
export type LcpErrorDetails = z.infer< typeof LcpErrorDetailsSchema >;
