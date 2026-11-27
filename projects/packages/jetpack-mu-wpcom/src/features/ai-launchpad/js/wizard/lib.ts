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

/** How long a wait after a Connect click or a prompt copy keeps checking before it times out. */
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
 * Whether to check for connections once on return to the tab: only while a tool can still connect and no wait
 * runs or is about to restart, since a wait checks by itself.
 *
 * @param state                 - The view's state.
 * @param state.waitingFor      - The tool waited for, if any.
 * @param state.waitingForOther - Whether a copy is waiting for another AI tool.
 * @param state.otherConnected  - Whether another AI tool shows as connected.
 * @param state.readOnly        - Whether a connected tool has only read-only access.
 * @param state.connected       - The AI tools shown as connected, in the order they connected.
 * @param state.timedOut        - The tool whose wait last timed out, if any.
 * @param state.otherTimedOut   - The count the last timed-out wait for another AI tool started from, if any.
 * @param state.pollsRemotely   - Whether each check asks WordPress.com over the network.
 * @return True to check on return.
 */
export function checkOnReturn( {
	waitingFor,
	waitingForOther,
	otherConnected,
	readOnly,
	connected,
	timedOut,
	otherTimedOut,
	pollsRemotely,
}: {
	waitingFor: AiTool | null;
	waitingForOther: boolean;
	otherConnected: boolean;
	readOnly: boolean;
	connected: AiTool[];
	timedOut: AiTool | null;
	otherTimedOut: number | null;
	pollsRemotely: boolean;
} ): boolean {
	if ( waitingFor || ( waitingForOther && ! otherConnected ) || connected.length === 2 ) {
		return false;
	}
	return (
		! rewaitOnReturn( { readOnly, connected, timedOut, pollsRemotely } ) &&
		rewaitOtherOnReturn( { timedOut: otherTimedOut, otherConnected, pollsRemotely } ) === null
	);
}

/**
 * The ChatGPT and Claude connections the endpoint returned, oldest first.
 *
 * @param connections - The connected integrations, newest first as the endpoint returns them.
 * @return The AI tools.
 */
function aiTools( connections: string[] ): AiTool[] {
	return connections
		.filter( ( tool ): tool is AiTool => Object.hasOwn( AI_TOOL_URLS, tool ) )
		.reverse();
}

/**
 * The newly connected AI tools: any ChatGPT or Claude connection not yet shown, the tool waited for last.
 * Until the tools connected before the view opened are known, only clicked tools count, so those don't read as new.
 *
 * @param state               - The check's state.
 * @param state.connections   - The connected integrations the endpoint returned, newest first.
 * @param state.clicked       - The tools the user clicked Connect on.
 * @param state.waitingFor    - The tool waited for, if any.
 * @param state.connected     - The tools already shown as connected.
 * @param state.existingKnown - Whether the tools connected before the view opened are known.
 * @return The newly connected tools, oldest first and the tool waited for last.
 */
export function findNewConnections( {
	connections,
	clicked,
	waitingFor,
	connected,
	existingKnown,
}: {
	connections: string[];
	clicked: AiTool[];
	waitingFor: AiTool | null;
	connected: AiTool[];
	existingKnown: boolean;
} ): AiTool[] {
	const matches = aiTools( connections ).filter(
		tool => ( existingKnown || clicked.includes( tool ) ) && ! connected.includes( tool )
	);
	return waitingFor && matches.includes( waitingFor )
		? [ ...matches.filter( tool => tool !== waitingFor ), waitingFor ]
		: matches;
}

/**
 * The tools to record as connected before the view opened. A clicked tool counts as new instead, and a tool already
 * shown stays as it is.
 *
 * @param state             - The read's state.
 * @param state.connections - The connected integrations the endpoint returned, newest first.
 * @param state.clicked     - The tools the user clicked Connect on.
 * @param state.connected   - The tools already shown as connected.
 * @return The tools, oldest first.
 */
export function existingConnections( {
	connections,
	clicked,
	connected,
}: {
	connections: string[];
	clicked: AiTool[];
	connected: AiTool[];
} ): AiTool[] {
	return aiTools( connections ).filter(
		tool => ! clicked.includes( tool ) && ! connected.includes( tool )
	);
}

/**
 * The count of other AI tools connected, from the endpoint's `other_connections`.
 *
 * @param value - The field as the endpoint returned it.
 * @return The count, or null when the endpoint can't tell.
 */
export function otherConnectionCount( value: unknown ): number | null {
	return Number.isInteger( value ) && ( value as number ) >= 0 ? ( value as number ) : null;
}

/**
 * Whether another AI tool connected since Copy prompt. Only a rise counts, so a tool connected earlier doesn't.
 *
 * @param baseline - The count to beat, or null while no count has been read.
 * @param count    - The latest count, or null when unknown.
 * @return True once the count is above the baseline.
 */
export function otherToolConnected( baseline: number | null, count: number | null ): boolean {
	return baseline !== null && count !== null && count > baseline;
}

/**
 * The count to wait from: the first known count, lowered when the count drops so a reconnect still counts as a rise.
 *
 * @param baseline - The count the wait started from, or null while no count has been read.
 * @param count    - The latest count, or null when unknown.
 * @return The count to wait from, or null when still unknown.
 */
export function otherWaitBaseline( baseline: number | null, count: number | null ): number | null {
	if ( baseline === null || count === null ) {
		return baseline ?? count;
	}
	return Math.min( baseline, count );
}

/**
 * The count to wait from again on return to the tab, after waiting for another AI tool timed out on remote checks.
 *
 * @param state                - The view's state.
 * @param state.timedOut       - The count the timed-out wait started from, if any.
 * @param state.otherConnected - Whether another AI tool shows as connected.
 * @param state.pollsRemotely  - Whether each check asks WordPress.com over the network.
 * @return The count to wait from, or null to stay as is.
 */
export function rewaitOtherOnReturn( {
	timedOut,
	otherConnected,
	pollsRemotely,
}: {
	timedOut: number | null;
	otherConnected: boolean;
	pollsRemotely: boolean;
} ): number | null {
	return pollsRemotely && ! otherConnected ? timedOut : null;
}

/**
 * Whether the account is gated as read only; only a clean Read only account is. Null means a fresh account or
 * one tuned per tool, and we don't override per-tool settings.
 *
 * @param level - The `access_level` the endpoint returned.
 * @return True only when the level is `read_only`.
 */
export function isReadOnlyAccess( level: string | null | undefined ): boolean {
	return level === 'read_only';
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

/**
 * The tool the AI tool view's footer opens once something connects, or the dashboard when there's no single tool to
 * open; read-only access overrides it.
 *
 * @param connected      - The AI tools shown as connected.
 * @param otherConnected - Whether another AI tool shows as connected.
 * @return The tool to open, `dashboard`, or null while nothing is connected.
 */
export function connectedFooterLead(
	connected: AiTool[],
	otherConnected: boolean
): AiTool | 'dashboard' | null {
	if ( connected.length === 1 ) {
		return connected[ 0 ];
	}
	return connected.length || otherConnected ? 'dashboard' : null;
}

export const TOTAL_STEPS = 2;

/**
 * How full the progress bar is. The AI tool view fills it only once a tool connects.
 *
 * @param step         - The current step index.
 * @param showAiTool   - Whether the AI tool view is shown.
 * @param anyConnected - Whether any AI tool shows as connected.
 * @return A fraction from 0 to 1.
 */
export function progressFraction(
	step: WizardStep,
	showAiTool: boolean,
	anyConnected: boolean
): number {
	return showAiTool && anyConnected ? 1 : ( step + 1 ) / TOTAL_STEPS;
}

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
