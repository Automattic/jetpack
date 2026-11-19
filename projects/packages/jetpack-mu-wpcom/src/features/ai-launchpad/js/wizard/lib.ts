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

/** The goals step's treatment variation. */
export const BRING_YOUR_AI_TOOL = 'bring_your_ai_tool';

/** The goals step's ExPlat variations (`wpcom_ai_launchpad_bring_your_ai_tool_202611_v2`). */
export type GoalsVariation = 'control' | typeof BRING_YOUR_AI_TOOL;

/** The wp.me short links that open the WordPress.com app in each AI tool. */
export const AI_TOOL_URLS = {
	chatgpt: 'https://wp.me/chatgpt',
	claude: 'https://wp.me/claude',
} as const;

export type AiTool = keyof typeof AI_TOOL_URLS;

/** How often the AI tool view checks for a connection while waiting, when checks are local. */
export const MCP_POLL_INTERVAL_MS = 4000;

/** How long after a Connect click the AI tool view keeps checking. */
export const MCP_POLL_TIMEOUT_MS = 10 * 60 * 1000;

/** How often the AI tool view checks while waiting when each check asks WordPress.com over the network. */
export const MCP_REMOTE_POLL_INTERVAL_MS = 30000;

/**
 * When the AI tool view checks while waiting, besides on return to the tab. A remote check is a WordPress.com
 * request, so it runs rarely and only while the tab shows, plus as the wait starts and on window focus.
 *
 * @param remote - Whether each check asks WordPress.com over the network.
 * @return The interval, whether it runs in a hidden tab, and whether to check as the wait starts and on focus.
 */
export function mcpPollSchedule( remote: boolean ): {
	intervalMs: number;
	whileHidden: boolean;
	onStart: boolean;
	onFocus: boolean;
} {
	return remote
		? { intervalMs: MCP_REMOTE_POLL_INTERVAL_MS, whileHidden: false, onStart: true, onFocus: true }
		: { intervalMs: MCP_POLL_INTERVAL_MS, whileHidden: true, onStart: false, onFocus: false };
}

/**
 * The tool to wait for again on return to the tab once a wait has ended: while read-only, so allowing full access
 * shows, and on remote checks after a timeout, since nothing checked while the tab was hidden.
 *
 * @param state               - The view's state.
 * @param state.readOnly      - Whether a connected tool has only read-only access.
 * @param state.connected     - The AI tools shown as connected, in the order they connected.
 * @param state.timedOut      - The tool whose wait last timed out, if any.
 * @param state.pollsRemotely - Whether each check asks WordPress.com over the network.
 * @return The tool to wait for, or null to stay as is.
 */
export function rewaitOnReturn( {
	readOnly,
	connected,
	timedOut,
	pollsRemotely,
}: {
	readOnly: boolean;
	connected: AiTool[];
	timedOut: AiTool | null;
	pollsRemotely: boolean;
} ): AiTool | null {
	if ( readOnly && connected.length ) {
		return connected[ connected.length - 1 ];
	}
	return pollsRemotely && timedOut && ! connected.includes( timedOut ) ? timedOut : null;
}

/**
 * The newly connected AI tools: tools the user clicked Connect on, not yet shown as connected, that have an active
 * connection. An existing connection counts, because a user who already connected is not sent through a new
 * approval. The most recently clicked tool comes last, so it is the latest connection.
 *
 * @param connections - The connected integrations the endpoint returned.
 * @param clicked     - The tools the user clicked Connect on.
 * @param latest      - The tool clicked most recently.
 * @param connected   - The tools already shown as connected.
 * @return The newly connected tools.
 */
export function findNewConnections(
	connections: string[],
	clicked: AiTool[],
	latest: AiTool,
	connected: AiTool[]
): AiTool[] {
	const matches = ( connections as AiTool[] ).filter(
		tool => clicked.includes( tool ) && ! connected.includes( tool )
	);
	return matches.includes( latest )
		? [ ...matches.filter( tool => tool !== latest ), latest ]
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
	if ( connected.length === 2 ) {
		return 'both_connected';
	}
	if ( waitingFor ) {
		return 'waiting';
	}
	return connected.length ? 'connected' : 'choose';
}

/**
 * The status shown in place of an AI tool's Connect button, or null to show Connect.
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
 * The step a `viewed` event reports for the current screen. The AI tool view reports `ai_tool` only when the page
 * opened on it; otherwise `mcp_screen_viewed` alone covers it.
 *
 * @param step          - The current step index.
 * @param choosing      - Whether the setup choice is shown.
 * @param showAiTool    - Whether the AI tool view is shown.
 * @param startOnAiTool - Whether the wizard opened on the AI tool view.
 * @return The viewed step.
 */
export function viewedStep(
	step: WizardStep,
	choosing: boolean,
	showAiTool: boolean,
	startOnAiTool = false
): ViewedStep | null {
	if ( choosing ) {
		return 'setup_choice';
	}
	if ( showAiTool ) {
		return startOnAiTool ? 'ai_tool' : null;
	}
	return 0 === step ? 'goal' : 'site_details';
}

/** Where the user allows the account's MCP write access. */
export const MCP_SETTINGS_URL = 'https://my.wordpress.com/me/preferences/mcp/write';

/** The WordPress.com MCP server, for AI tools without a Connect link. */
const MCP_SERVER_URL = 'https://public-api.wordpress.com/wpcom/v2/mcp/v1';

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
 * Whether the wizard opens on the "Guide me" or "Build with AI" choice before the goals.
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

/** The screen the wizard opens on. */
export type FirstScreen = 'setup_choice' | 'ai_tool' | 'goal';

/**
 * The screen the wizard opens on: the AI tool view when the URL asks for it, else the setup choice in the treatment.
 *
 * @param variation     - The goals step's variation.
 * @param startOnAiTool - Whether the URL asks to open on the AI tool view.
 * @return The first screen.
 */
export function firstScreen( variation: GoalsVariation, startOnAiTool: boolean ): FirstScreen {
	if ( startOnAiTool ) {
		return 'ai_tool';
	}
	return showsSetupChoice( variation ) ? 'setup_choice' : 'goal';
}

/** The footer's way out, or null for none. */
export type FooterExit = 'back' | 'skip' | null;

/**
 * The footer's way out: Back towards the setup choice once the treatment has left it, else Skip. An AI tool view the
 * URL opened offers Back only with a URL out of Site Setup, since Skip would dismiss Site Setup.
 *
 * @param state               - The wizard's state.
 * @param state.variation     - The goals step's variation.
 * @param state.choosing      - Whether the setup choice is shown.
 * @param state.showAiTool    - Whether the AI tool view is shown.
 * @param state.startOnAiTool - Whether the wizard opened on the AI tool view.
 * @param state.hasBackUrl    - Whether Back has a URL to leave for.
 * @return The footer's exit.
 */
export function footerExit( {
	variation,
	choosing,
	showAiTool,
	startOnAiTool,
	hasBackUrl,
}: {
	variation: GoalsVariation;
	choosing: boolean;
	showAiTool: boolean;
	startOnAiTool: boolean;
	hasBackUrl: boolean;
} ): FooterExit {
	if ( startOnAiTool && showAiTool ) {
		return hasBackUrl ? 'back' : null;
	}
	return showAiTool || ( showsSetupChoice( variation ) && ! choosing ) ? 'back' : 'skip';
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

/**
 * The `integration` "Go to my dashboard" reports.
 *
 * @param connected    - The AI tools shown as connected, in the order they connected.
 * @param promptCopied - Whether the prompt for another AI tool was copied.
 * @return The integration.
 */
export function dashboardIntegration(
	connected: AiTool[],
	promptCopied: boolean
): AiTool | 'other' | 'none' {
	return connected[ connected.length - 1 ] ?? ( promptCopied ? 'other' : 'none' );
}

/**
 * Whether the AI tool view's footer offers "Go to my dashboard" before any tool connects. Without another exit it is
 * the only way out, since the wizard cannot be dismissed.
 *
 * @param promptCopied - Whether the prompt for another AI tool was copied.
 * @param exit         - The footer's other way out.
 * @return True when the footer shows the button.
 */
export function footerShowsDashboard( promptCopied: boolean, exit: FooterExit ): boolean {
	return promptCopied || exit === null;
}

/**
 * The `goals_variation` the AI tool view's events report: none when the URL opened it, since that read assigns no
 * variation and reporting `control` would count these visits in the experiment's control group.
 *
 * @param variation     - The goals step's variation.
 * @param startOnAiTool - Whether the wizard opened on the AI tool view.
 * @return The variation to report, or null to leave it out.
 */
export function trackedVariation(
	variation: GoalsVariation,
	startOnAiTool: boolean
): GoalsVariation | null {
	return startOnAiTool ? null : variation;
}
