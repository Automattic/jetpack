/**
 * Tabs a host opens behind `showFeaturesView`. They carry the internal-testing
 * badge. Settings (view key `mcp`) ships publicly and is not one of them,
 * though its AI features section sits behind the same gate.
 */
export const GATED_VIEWS = [ 'overview' ];

/**
 * Views the page notice speaks for: Overview, and the Settings view (`mcp`) —
 * for its AI features section, or for the whole view when the state is about
 * the connection. Both answer only behind `showFeaturesView`, which the page
 * checks before asking. The Settings sub-views carry no AI features content.
 */
export const NOTICE_VIEWS = [ 'overview', 'mcp' ];
