export interface Settings {
	comments: boolean;
	highlander_comment_form_prompt: string;
	enable_blocks_comments: boolean;
	'gravatar-hovercards': boolean;
	'comment-likes': boolean;
	markdown: boolean;
	wpcom_publish_comments_with_markdown: boolean;
}

export type FeatureModule = 'gravatar-hovercards' | 'markdown' | 'comment-likes';

// Modules a filter forces on or off.
export type ModuleOverrides = Partial<
	Record< 'comments' | FeatureModule, 'active' | 'inactive' >
>;

export interface DiscussionSettings {
	url: string;
	requireNameEmail: boolean;
	commentRegistration: boolean;
	showAvatars: boolean;
	cookiesOptIn: boolean;
}

export interface NewsletterSettings {
	active: boolean;
	url: string;
	subscribeBlog: boolean;
	subscribeReplies: boolean;
}

export interface PreviewData {
	styleUrl: string;
	// Custom properties from the theme's global styles; null for a theme without theme.json.
	theme: Record< string, string > | null;
	defaultAvatar: string;
}

export interface CommentsScriptData {
	settings: Settings;
	modules: FeatureModule[];
	overrides: ModuleOverrides;
	discussion: DiscussionSettings;
	newsletter: NewsletterSettings;
	preview: PreviewData;
}
