import type { ViewedStep } from '../lib/tracks.ts';
import type { GoalSlug, WizardInput } from '../lib/types.ts';

export const GOAL_SLUGS: GoalSlug[] = [
	'write',
	'build',
	'sell',
	'newsletter',
	'educate',
	'portfolio',
];

/** The goals step's treatment variation. Never a saved goal. */
export const BRING_YOUR_AI_TOOL = 'bring_your_ai_tool';

/** The goals step's ExPlat variations (`wpcom_ai_launchpad_bring_your_ai_tool_202611`). */
export type GoalsVariation = 'control' | typeof BRING_YOUR_AI_TOOL;

/** The wp.me short links that open the WordPress.com app in each AI tool. */
export const AI_TOOL_URLS = {
	chatgpt: 'https://wp.me/chatgpt',
	claude: 'https://wp.me/claude',
} as const;

export type AiTool = keyof typeof AI_TOOL_URLS;

/** A connection from `GET /wpcom/v2/ai-launchpad/mcp-connections`, `connected_at` in Unix seconds. */
export interface McpConnection {
	integration: string;
	connected_at: number;
}

/** How often the AI tool view checks for a connection while waiting. */
export const MCP_POLL_INTERVAL_MS = 4000;

/** How long after a Set up click the AI tool view keeps checking. */
export const MCP_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * The newly connected AI tools: tools the user clicked Set up on, not yet shown as connected, that have an active
 * connection. An existing connection counts, because a user who already connected is not sent through a new
 * approval, and a token refresh makes `connected_at` unreliable as a first-connection time. The most recently
 * clicked tool comes last, so it is the latest connection.
 *
 * @param connections - The connections the endpoint returned.
 * @param clicks      - When each tool's Set up was clicked, in Unix seconds.
 * @param clicked     - The tool clicked most recently.
 * @param connected   - The tools already shown as connected.
 * @return The newly connected tools.
 */
export function findNewConnections(
	connections: McpConnection[],
	clicks: Partial< Record< AiTool, number > >,
	clicked: AiTool,
	connected: AiTool[] = []
): AiTool[] {
	const matches = connections
		.map( connection => connection.integration as AiTool )
		.filter( tool => clicks[ tool ] !== undefined && ! connected.includes( tool ) );
	return matches.includes( clicked )
		? [ ...matches.filter( tool => tool !== clicked ), clicked ]
		: matches;
}

/**
 * Whether the account's MCP access level leaves AI tools unable to build. Only `full` allows every write tool;
 * `read_only`, and null for an account whose settings match neither level, may not.
 *
 * @param level - The `access_level` the endpoint returned.
 * @return True unless the level is full.
 */
export function isReadOnlyAccess( level: string | null | undefined ): boolean {
	return level !== 'full';
}

/** Which version of the "Which AI do you use?" view to show, which picks its title and subtitle. */
export type AiToolView = 'choose' | 'waiting' | 'connected' | 'both_connected' | 'read_only';

/**
 * The version of the AI tool view to show. Read-only access wins, then both tools connected, then a wait.
 *
 * @param connected  - The AI tools shown as connected.
 * @param waitingFor - The tool waiting for a connection, if any.
 * @param readOnly   - Whether a connected tool has only read-only access.
 * @return The view.
 */
export function aiToolView(
	connected: AiTool[],
	waitingFor: AiTool | null,
	readOnly: boolean
): AiToolView {
	if ( readOnly ) {
		return 'read_only';
	}
	if ( connected.length === Object.keys( AI_TOOL_URLS ).length ) {
		return 'both_connected';
	}
	if ( waitingFor ) {
		return 'waiting';
	}
	return connected.length ? 'connected' : 'choose';
}

/**
 * The status shown in place of an AI tool's Set up button, or null to show Set up.
 *
 * @param tool       - The row's AI tool.
 * @param connected  - The AI tools shown as connected.
 * @param waitingFor - The tool waiting for a connection, if any.
 * @param readOnly   - Whether a connected tool has only read-only access.
 * @return The row's status.
 */
export function aiToolRowStatus(
	tool: AiTool,
	connected: AiTool[],
	waitingFor: AiTool | null,
	readOnly: boolean
): 'connected' | 'read_only' | 'waiting' | null {
	if ( connected.includes( tool ) ) {
		return readOnly ? 'read_only' : 'connected';
	}
	return waitingFor === tool ? 'waiting' : null;
}

/**
 * The step a `viewed` event reports for the current screen, or null for the AI tool view, which records its own.
 *
 * @param step       - The current step index.
 * @param choosing   - Whether the setup choice is shown.
 * @param showAiTool - Whether the AI tool view is shown.
 * @return The viewed step.
 */
export function viewedStep(
	step: WizardStep,
	choosing: boolean,
	showAiTool: boolean
): ViewedStep | null {
	if ( choosing ) {
		return 'setup_choice';
	}
	if ( showAiTool ) {
		return null;
	}
	return 0 === step ? 'goal' : 'site_details';
}

/** Where the user allows the account's MCP write access. */
export const MCP_SETTINGS_URL = 'https://my.wordpress.com/me/preferences/mcp/write';

/** The WordPress.com MCP server, for AI tools without a Set up link. */
export const MCP_SERVER_URL = 'https://public-api.wordpress.com/wpcom/v2/mcp/v1';

/** Has any AI tool connect itself. Matches HELPER_PROMPT on Calypso's /me/mcp page; keep them in sync. */
export const CONNECT_YOURSELF_PROMPT = `Connect yourself to my WordPress.com account over MCP. The server is ${ MCP_SERVER_URL }. Tell me what to click or run for this app, wait while I sign in and approve the connection, then list my sites to confirm it works.`;

/** How long Copy prompt shows Copied, as on /me/mcp. */
export const COPIED_RESET_MS = 1600;

/** Where each AI tool opens a new chat. */
export const AI_TOOL_CHAT_URLS: Record< AiTool, string > = {
	chatgpt: 'https://chatgpt.com/',
	claude: 'https://claude.ai/new',
};

export const TOTAL_STEPS = 2;

export type WizardStep = 0 | 1;

export interface WizardState {
	goal: GoalSlug | null;
	siteName: string;
	intent: string;
	locale: string;
	uiLocale: string;
}

/**
 * The variation to render. Anything but the treatment, including no assignment, renders control.
 *
 * @param variation - The `goals_variation` the server returned, if any.
 * @return The variation.
 */
export function goalsVariation( variation: string | null | undefined ): GoalsVariation {
	return variation === BRING_YOUR_AI_TOOL ? BRING_YOUR_AI_TOOL : 'control';
}

/**
 * Whether the wizard opens on the "Guide me" or "Build with my AI" choice before the goals.
 *
 * @param variation - The goals step's variation.
 * @return True in the treatment.
 */
export function showsSetupChoice( variation: GoalsVariation ): boolean {
	return variation === BRING_YOUR_AI_TOOL;
}

/**
 * Whether the user may advance from the given step. Goal is the only required
 * field; the details step is always free to submit.
 *
 * @param step  - The current step index.
 * @param state - The collected wizard state.
 * @return True when the primary action is enabled.
 */
export function canContinue( step: WizardStep, state: WizardState ): boolean {
	return step === 0 ? state.goal !== null : true;
}

/**
 * Whether the given step is the final one.
 *
 * @param step - The current step index.
 * @return True on the last step.
 */
export function isLastStep( step: WizardStep ): boolean {
	return step === TOTAL_STEPS - 1;
}

/**
 * The body sent to `PUT /wpcom/v2/ai-launchpad/wizard` on Finish. The REST
 * endpoint requires a non-null goal, so callers gate this behind a selected
 * goal.
 *
 * @param goal  - The selected goal.
 * @param state - The collected wizard state.
 * @return The request body.
 */
export function buildWizardPayload( goal: GoalSlug, state: WizardState ): WizardInput {
	return {
		goal,
		site_name: state.siteName,
		description: state.intent,
		locale: state.locale,
		ui_locale: state.uiLocale,
	};
}

/**
 * Pick one example placeholder from a goal's variants. Extracted so the
 * rotating behavior is unit-testable without rendering. The default uses
 * `Math.random`; tests pass a deterministic picker.
 *
 * @param variants - The non-empty list of example placeholders.
 * @param pick     - Returns a fraction in [0, 1); defaults to Math.random.
 * @return One placeholder from the list.
 */
export function pickPlaceholder( variants: string[], pick: () => number = Math.random ): string {
	return variants[ Math.floor( pick() * variants.length ) ];
}
