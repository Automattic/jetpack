/**
 * Identifiers for the post-detail page's stored preferences.
 *
 * Kept separate from the main dashboard's scope so a post-detail tab layout
 * never collides with a dashboard section layout: the two pages customize
 * independent widget grids.
 */

/**
 * Preferences scope under which the post-detail tab layouts are stored.
 */
export const POST_DETAIL_PREFERENCES_SCOPE = 'jetpack-premium-analytics/post-detail';

/** Preferences key holding the per-tab layout map. */
export const POST_DETAIL_TAB_LAYOUTS_KEY = 'postDetailTabLayouts';
