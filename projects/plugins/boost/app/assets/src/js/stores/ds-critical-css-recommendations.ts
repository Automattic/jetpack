// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod';
import { client, JSONSchema } from './data-sync-client';

const CriticalCssErrorsSchema = z.object( {
	url: z.string(),
	message: z.string(),
	meta: JSONSchema.optional(),
	type: z
		.enum( [
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
		] )
		.catch( 'UnknownError' ),
} );

const CriticalCssIssueSchema = z.object( {
	provider_name: z.string(),
	key: z.string(),
	status: z.enum( [ 'active', 'dismissed' ] ),
	errors: z.array( CriticalCssErrorsSchema ).nonempty(),
} );

export type CriticalCssErrorDetails = z.infer< typeof CriticalCssErrorsSchema >;
export type CriticalCssIssue = z.infer< typeof CriticalCssIssueSchema >;

const issues = client.createAsyncStore(
	'critical_css_issues',
	z.array( CriticalCssIssueSchema ).catch( [] )
);
export const issuesStore = issues.store;

// 🍅 REFACTORING: Eventually this should be removed.
const windowIssues = Jetpack_Boost.criticalCSS.status.issues ?? [];
const validatedIssues = CriticalCssIssueSchema.array().parse( windowIssues );
// eslint-disable-next-line no-console
console.log( 'Overriding issue store from global', validatedIssues );
issuesStore.override( validatedIssues as CriticalCssIssue[] );
