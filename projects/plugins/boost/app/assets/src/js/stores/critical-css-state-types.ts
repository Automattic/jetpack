import z from 'zod';
import { JSONSchema } from './data-sync-client';

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

const CriticalCssErrorDetailsSchema = z.object( {
	url: z.coerce.string(),
	message: z.coerce.string(),
	meta: z.record( JSONSchema ),
	type: CriticalCssErrorType,
} );

const ProviderSchema = z.object( {
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
		callback_passthrough: z.record( z.unknown() ).optional(),
		generation_nonce: z.coerce.string().optional(),
		proxy_nonce: z.coerce.string().optional(),
		// Source provider information - which URLs to generate CSS for.
		providers: z.array( ProviderSchema ),
		status: z.enum( [ 'not_generated', 'generated', 'pending', 'error' ] ),
		updated: z.coerce.number().optional(),
		status_error: z.union( [ z.coerce.string(), CriticalCssErrorDetailsSchema ] ).optional(),
		created: z.coerce.number().optional(),
		viewports: z
			.array(
				z.object( {
					type: z.coerce.string(),
					width: z.coerce.number(),
					height: z.coerce.number(),
				} )
			)
			.optional(),
	} )
	.catch( {
		created: 0,
		updated: 0,
		callback_passthrough: {},
		status: 'not_generated',
		status_error: '',
		viewports: [],
		providers: [],
	} );

/**
 * Infer Zod Types
 */
export type Provider = z.infer< typeof ProviderSchema >;
export type CriticalCssState = z.infer< typeof CriticalCssStateSchema >;
export type Critical_CSS_Error_Type = z.infer< typeof CriticalCssErrorType >;
export type CriticalCssErrorDetails = z.infer< typeof CriticalCssErrorDetailsSchema >;
