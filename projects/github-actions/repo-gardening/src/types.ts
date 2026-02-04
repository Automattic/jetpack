import { GitHub } from '@actions/github/lib/utils.js';

/**
 * The Octokit instance type returned by getOctokit().
 */
export type OctokitClient = InstanceType< typeof GitHub >;

/**
 * A webhook payload that includes a pull_request field.
 * Used by PR-related tasks.
 */
export interface PullRequestPayload {
	action?: string;
	number: number;
	pull_request: {
		state: string;
		draft: boolean;
		title: string;
		body: string;
		head: {
			ref: string;
			repo: {
				full_name: string;
			};
		};
		base: {
			repo: {
				full_name: string;
			};
		};
		html_url: string;
		user: {
			login: string;
		};
		merged?: boolean;
	};
	repository: {
		name: string;
		full_name: string;
		html_url: string;
		owner: {
			login: string;
		};
	};
	sender?: {
		login: string;
	};
}

/**
 * A webhook payload for push events.
 * Used by the add-milestone task.
 */
export interface PushPayload {
	ref: string;
	commits: Array< {
		message: string;
	} >;
	repository: {
		name: string;
		full_name: string;
		html_url: string;
		owner: {
			login: string;
		};
	};
}

/**
 * A webhook payload that includes an issue field.
 * Used by issue-related tasks.
 */
export interface IssuePayload {
	action?: string;
	issue: {
		number: number;
		body: string;
		title: string;
		state: string;
		html_url: string;
		user: {
			login: string;
		};
	};
	repository: {
		name: string;
		full_name: string;
		html_url: string;
		owner: {
			login: string;
		};
	};
}

/**
 * A webhook payload for issue_comment events.
 */
export interface IssueCommentPayload {
	action?: string;
	comment: {
		body: string;
		html_url: string;
		user: {
			login: string;
		};
	};
	issue: {
		number: number;
		body: string;
		title: string;
		state: string;
		html_url: string;
		user: {
			login: string;
		};
	};
	repository: {
		name: string;
		full_name: string;
		html_url: string;
		owner: {
			login: string;
		};
	};
}

/**
 * Union type for any payload that task functions may receive.
 */
export type TaskPayload = PullRequestPayload | PushPayload | IssuePayload | IssueCommentPayload;

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
