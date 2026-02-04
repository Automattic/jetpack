import { GitHub } from '@actions/github/lib/utils.js';
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
 * The function signature for an automation task.
 */
export type TaskFunction = ( payload: TaskPayload, octokit: OctokitClient ) => Promise< void >;

/**
 * An automation definition used in the main index.
 */
export interface Automation {
	event: string;
	action?: string[];
	task: TaskFunction;
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
