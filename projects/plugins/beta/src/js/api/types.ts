/**
 * TypeScript types matching the Jetpack Beta WP Abilities API payloads.
 *
 * @package
 */

export type PluginListItem = {
	slug: string;
	name: string;
	active_which: 'stable' | 'dev' | null;
	active_version: string | null;
	manage_url: string;
};

export type BranchCard = {
	section: string;
	source: string | null;
	id: string | null;
	branch: string | null;
	version: string | null;
	pretty_version: string | null;
	/** GitHub PR number for feature-branch (`pr`) cards; null otherwise. */
	pr: number | null;
	is_active: boolean;
};

export type CurrentlyRunning = {
	which: string | null;
	source: string | null;
	id: string | null;
	version: string | null;
	pretty_version: string | null;
};

export type PluginView = {
	name: string;
	is_mu_plugin: boolean;
	bug_report_url: string;
	currently_running: CurrentlyRunning | null;
	sections: BranchCard[];
	to_test_html: string | null;
	what_changed_html: string | null;
};

export type Settings = {
	autoupdates: boolean;
	email_notifications: boolean;
	skip_email: boolean;
};

export type PluginUpdate = {
	plugin_file: string;
	name: string;
	new_version: string;
};

export type BetaBootstrap = {
	apiRoot: string;
	apiNonce: string;
	plugin: string | null;
	pluginName: string | null;
	plugins: PluginListItem[] | null;
	adminUrl: string;
};

declare global {
	interface Window {
		JetpackBeta: BetaBootstrap;
	}
}
