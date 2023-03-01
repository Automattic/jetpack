// eslint-disable-next-line import/no-extraneous-dependencies
import z from 'zod';
import { client, JSONSchema } from './data-sync-client';

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

export type Critical_CSS_Error_Type = z.infer< typeof CriticalCssErrorType >;
const CriticalCssErrorDetailsSchema = z.object( {
	url: z.coerce.string(),
	message: z.coerce.string(),
	meta: z.record( JSONSchema ),
	type: CriticalCssErrorType,
} );

export type CriticalCssErrorDetails = z.infer< typeof CriticalCssErrorDetailsSchema >;

const CriticalCssIssueSchema = z.object( {
	provider_name: z.coerce.string(),
	key: z.coerce.string(),
	status: z.enum( [ 'active', 'dismissed' ] ).catch( 'active' ),
	errors: z.array( CriticalCssErrorDetailsSchema ),
} );

export type CriticalCssIssue = z.infer< typeof CriticalCssIssueSchema >;

export const ErrorSetSchema = z.object( {
	type: CriticalCssErrorType,
	firstMeta: z.record( z.unknown() ),
	byUrl: z.record( CriticalCssErrorDetailsSchema ),
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
	// Status message
	// @REFACTORING: Unused right now
	status_message: z.coerce.string().optional(),
	// Error details
	errors: z.array( CriticalCssErrorDetailsSchema ).optional(),
} );
export type Provider = z.infer< typeof ProviderSchema >;
export const CriticalCssStatusSchema = z
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
		issues: z.array( CriticalCssIssueSchema ).optional(),
	} )
	.catch( {
		callback_passthrough: {},
		generation_nonce: '',
		proxy_nonce: '',
		providers: [],
		status: 'not_generated',
		updated: 0,
		status_error: '',
		created: 0,
		viewports: [],
		issues: [],
	} );
export type CriticalCssStatus = z.infer< typeof CriticalCssStatusSchema >;

export const criticalCssDS = client.createAsyncStore(
	'critical_css_state',
	CriticalCssStatusSchema
);
