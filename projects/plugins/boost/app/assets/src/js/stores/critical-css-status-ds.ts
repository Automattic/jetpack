// eslint-disable-next-line import/no-extraneous-dependencies
import z from 'zod';
import { client, JSONSchema } from './data-sync-client';

const CriticalCssErrorType = z.enum([
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
]);

export type Critical_CSS_Error_Type = z.infer<typeof CriticalCssErrorType>;
const CriticalCssErrorDetailsSchema = z.object({
	url: z.coerce.string(),
	message: z.coerce.string(),
	meta: JSONSchema,
	type: CriticalCssErrorType,
});

export type CriticalCssErrorDetails = z.infer<typeof CriticalCssErrorDetailsSchema>;

const CriticalCssIssueSchema = z.object({
	provider_name: z.coerce.string(),
	key: z.coerce.string(),
	status: z.enum(['active', 'dismissed']).catch('active'),
	errors: z.array(CriticalCssErrorDetailsSchema),
});

export type CriticalCssIssue = z.infer<typeof CriticalCssIssueSchema>;

export const ErrorSetSchema = z.object({
	type: CriticalCssErrorType,
	firstMeta: z.record(z.unknown()),
	byUrl: z.record(CriticalCssErrorDetailsSchema),
});

export const CriticalCssStatusSchema = z
	.object({
		progress: z.coerce.number(),
		retried_show_stopper: z.coerce.boolean(),
		callback_passthrough: z.record(z.unknown()).optional(),
		generation_nonce: z.coerce.string().optional(),
		proxy_nonce: z.coerce.string().optional(),
		pending_provider_keys: z.record(z.array(z.coerce.string())).optional(),
		provider_success_ratio: z.record(z.coerce.number()).optional(),
		status: z.coerce.string(),
		updated: z.coerce.number().optional(),
		core_providers: z.array(z.coerce.string()).optional(),
		core_providers_status: z.coerce.string().optional(),
		status_error: z.union([z.coerce.string(), CriticalCssErrorDetailsSchema]).optional(),
		success_count: z.coerce.number(),
		created: z.coerce.number().optional(),
		viewports: z.array(z.object({
			type: z.coerce.string(),
			width: z.coerce.number(),
			height: z.coerce.number(),
		})).optional(),
		issues: z.array(CriticalCssIssueSchema).optional(),
	})

export const criticalCSSState = client.createAsyncStore(
	'critical_css_state',
	CriticalCssStatusSchema
);


criticalCSSState.store.subscribe((state) => {
	console.log('criticalCSSState', state);
});
