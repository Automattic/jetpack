import { JSONSchema } from '$lib/utils/json-types';
import z from 'zod';

const CriticalCssErrorType = z.enum( [
	'SuccessTargetError',
	'UrlError',
	'HttpError',
	'UnknownError',
	'CrossDomainError',
	'LoadTimeoutError',
	'RedirectError',
	'UrlVerifyError',
	'EmptyCSSError',
	'XFrameDenyError',
] );

export const CriticalCssErrorDetailsSchema = z.object( {
	url: z.coerce.string(),
	message: z.coerce.string(),
	meta: z.record( JSONSchema ).catch( {} ),
	type: CriticalCssErrorType,
} );

export const ProviderSchema = z.object( {
	// Unique provider key, for example "single_post"
	key: z.coerce.string(),
	// The label. For example "Single Post"
	label: z.coerce.string(),
	// URLs to generate CSS for.
	urls: z.array( z.coerce.string() ),
	// Required success ratio defined by the Provider class.
	success_ratio: z.coerce.number(),
	// Status
	status: z
		.enum( [ 'success', 'pending', 'error', 'validation-error' ] )
		// Validation Error only should occur in the UI, not in the API.
		.catch( 'validation-error' ),
	// Error details
	errors: z.array( CriticalCssErrorDetailsSchema ).optional(),
	// If this an error, has it been dismissed?
	error_status: z.enum( [ 'active', 'dismissed' ] ).optional(),
} );

export const CriticalCssStateSchema = z
	.object( {
		// Source provider information - which URLs to generate CSS for.
		providers: z.array( ProviderSchema ),
		status: z.enum( [ 'not_generated', 'generated', 'pending', 'error' ] ),
		status_error: z.coerce.string().optional(),
		created: z.coerce.number().optional(),
		updated: z.coerce.number().optional(),
	} )
	.catch( {
		providers: [],
		status: 'not_generated',
		status_error: '',
		created: 0,
		updated: 0,
	} );

/**
 * Infer Zod Types
 */
export type Provider = z.infer< typeof ProviderSchema >;
export type CriticalCssState = z.infer< typeof CriticalCssStateSchema >;
export type Critical_CSS_Error_Type = z.infer< typeof CriticalCssErrorType >;
export type CriticalCssErrorDetails = z.infer< typeof CriticalCssErrorDetailsSchema >;
