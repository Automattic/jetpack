import type { GoalSlug, WizardInput } from '../lib/types.ts';

export const GOAL_SLUGS: GoalSlug[] = [
	'write',
	'build',
	'sell',
	'newsletter',
	'educate',
	'portfolio',
];

/** The goals step's treatment variation, also sent as `goal_clicked` when its banner is clicked. Never a saved goal. */
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
 * The newly connected AI tool, if any: a tool the user clicked Set up on, not yet shown as connected, that has an
 * active connection. An existing connection counts, because a user who already connected is not sent through a
 * new approval, and a token refresh makes `connected_at` unreliable as a first-connection time. When several
 * match, the most recently clicked tool wins.
 *
 * @param connections - The connections the endpoint returned.
 * @param clicks      - When each tool's Set up was clicked, in Unix seconds.
 * @param clicked     - The tool clicked most recently.
 * @param connected   - The tools already shown as connected.
 * @return The newly connected tool, or null.
 */
export function findNewConnection(
	connections: McpConnection[],
	clicks: Partial< Record< AiTool, number > >,
	clicked: AiTool,
	connected: AiTool[] = []
): AiTool | null {
	const matches = connections
		.map( connection => connection.integration as AiTool )
		.filter( tool => clicks[ tool ] !== undefined && ! connected.includes( tool ) );
	return matches.includes( clicked ) ? clicked : ( matches[ 0 ] ?? null );
}

/** Where the user changes the account's MCP access level. */
export const MCP_SETTINGS_URL = 'https://wordpress.com/me/mcp';

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
