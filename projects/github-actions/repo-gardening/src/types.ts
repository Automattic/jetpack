import { GitHub } from '@actions/github/lib/utils';
import type {
	PullRequestEvent,
	PushEvent,
	IssuesEvent,
	IssueCommentEvent,
} from '@octokit/webhooks-types';

// Re-export webhook payload types from the canonical source.
export type { PullRequestEvent, PushEvent, IssuesEvent, IssueCommentEvent };

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
