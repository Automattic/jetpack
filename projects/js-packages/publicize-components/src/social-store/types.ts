export type SharesData = {
	is_share_limit_enabled: boolean;
	to_be_publicized_count: number;
	share_limit: number;
	publicized_count: number;
	show_advanced_plan_upgrade_nudge: boolean;
	shared_posts_count: number;
};

export type JetpackSettings = {
	showNudge?: boolean;
};

// TODO we should have a consistent structure across all the pages - editor, dashboard, admin page etc.
export type SocialStoreState = {
	sharesData: SharesData;
	// on post editor
	hasPaidPlan?: boolean;
	// on Jetack Social admin page
	jetpackSettings?: JetpackSettings;
};
