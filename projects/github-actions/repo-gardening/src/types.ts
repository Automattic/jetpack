import { GitHub } from '@actions/github/lib/utils';
import type { components } from '@octokit/openapi-webhooks-types';

// Re-export webhook payload types from the canonical source.
export type IssueComment = components[ 'schemas' ][ 'webhooks_issue_comment' ];

export type PushEvent = components[ 'schemas' ][ 'webhook-push' ];

export type PullRequestClosedEvent = components[ 'schemas' ][ 'webhook-pull-request-closed' ];
export type PullRequestEditedEvent = components[ 'schemas' ][ 'webhook-pull-request-edited' ];
export type PullRequestLabeledEvent = components[ 'schemas' ][ 'webhook-pull-request-labeled' ];
export type PullRequestOpenedEvent = components[ 'schemas' ][ 'webhook-pull-request-opened' ];
export type PullRequestReopenedEvent = components[ 'schemas' ][ 'webhook-pull-request-reopened' ];
export type PullRequestSynchronizeEvent =
	components[ 'schemas' ][ 'webhook-pull-request-synchronize' ];
export type PullRequestEvent =
	| PullRequestClosedEvent
	| PullRequestEditedEvent
	| PullRequestLabeledEvent
	| PullRequestOpenedEvent
	| PullRequestReopenedEvent
	| PullRequestSynchronizeEvent;

export type IssuesClosedEvent = components[ 'schemas' ][ 'webhook-issues-closed' ];
export type IssuesEditedEvent = components[ 'schemas' ][ 'webhook-issues-edited' ];
export type IssuesLabeledEvent = components[ 'schemas' ][ 'webhook-issues-labeled' ];
export type IssuesOpenedEvent = components[ 'schemas' ][ 'webhook-issues-opened' ];
export type IssuesReopenedEvent = components[ 'schemas' ][ 'webhook-issues-reopened' ];
export type IssuesEvent =
	| IssuesClosedEvent
	| IssuesEditedEvent
	| IssuesLabeledEvent
	| IssuesOpenedEvent
	| IssuesReopenedEvent;

export type IssueCommentCreatedEvent = components[ 'schemas' ][ 'webhook-issue-comment-created' ];
export type IssueCommentEvent = IssueCommentCreatedEvent;

/**
 * The Octokit instance type returned by getOctokit().
 */
export type OctokitClient = InstanceType< typeof GitHub >;

/**
 * Union type for any payload that task functions may receive.
 */
export type TaskPayload = PullRequestEvent | PushEvent | IssuesEvent | IssueCommentEvent;

/**
 * Maps GitHub event names to their corresponding webhook payload types.
 */
interface EventPayloadMap {
	pull_request_target: PullRequestEvent;
	push: PushEvent;
	issues: IssuesEvent;
	issue_comment: IssueCommentEvent;
}

/**
 * An automation definition used in the main index.
 *
 * Uses a mapped type to pair each event name with its corresponding
 * payload type, ensuring type safety across the event–task boundary.
 */
export type Automation = {
	[ E in keyof EventPayloadMap ]: {
		event: E;
		action?: string[];
		task: ( payload: EventPayloadMap[ E ], octokit: OctokitClient ) => Promise< void > | void;
	};
}[ keyof EventPayloadMap ];

/**
 * Team assignment entry in the automattic-label-team-assignments mapping.
 */
export interface TeamAssignment {
	team: string;
	labels: string[];
	slack_id?: string;
	board_id?: string;
}
