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
 * An automation definition used in the main index.
 *
 * Each task function accepts a specific payload subtype (PullRequestEvent, IssuesEvent, etc.)
 * but at runtime the correct payload is guaranteed by event-name matching.
 */
export interface Automation {
	event: string;
	action?: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	task: ( payload: any, octokit: OctokitClient ) => Promise< void > | void;
}

/**
 * Team assignment entry in the automattic-label-team-assignments mapping.
 */
export interface TeamAssignment {
	team: string;
	labels: string[];
	slack_id?: string;
	board_id?: string;
}
