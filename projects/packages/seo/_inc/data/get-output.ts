import { getScriptData } from '@automattic/jetpack-script-data';

// Shape of the output state the server bootstraps onto
// `window.JetpackScriptData.seo.output` (see `Dashboard_Data::get_output_data()`).
export interface OutputState {
	/** Whether Jetpack's SEO output is paused, by another SEO plugin or a filter. */
	paused: boolean;
	/** The SEO plugin that manages the site's SEO instead, or '' when none does. */
	conflicting_plugin: string;
}

interface SeoScriptData {
	seo?: { output?: OutputState };
}

const LIVE: OutputState = { paused: false, conflicting_plugin: '' };

/**
 * Read whether Jetpack's SEO output is paused, and which plugin owns it. Every tab
 * reads this one bootstrap for its page banner and its locked cards, so they all
 * agree on the cause.
 *
 * Defaults to live output when the slice is missing, so a stale page snapshot
 * never locks settings that can be saved.
 *
 * @return The output state.
 */
export default function getOutput(): OutputState {
	return ( getScriptData() as SeoScriptData | undefined )?.seo?.output ?? LIVE;
}
