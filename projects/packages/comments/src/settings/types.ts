import type { ComponentType } from 'react';

export type PreviewUser = {
	name: string;
	avatar: string;
};

/** What `Form_Preview::get_data()` hands the settings. */
export type PreviewData = {
	styleUrl: string;
	theme: Record< string, string > | null;
	showAvatars: boolean;
	user: PreviewUser;
};

/** What PHP hands the settings bundle. */
export type SettingsData = {
	/** The form preview's data, or null where Jetpack Comments' new form isn't on. */
	preview: PreviewData | null;
	/** Whether readers can write in blocks. */
	hasBlockEditor: boolean;
};

/** What the dashboard passes the card. */
export type HostProps = {
	/** Whether the module can't be used, as in offline mode. */
	isUnavailable?: boolean;
	/** Called after a save, so the host can refresh what it holds. */
	onSave?: () => void;
	/** Called when the card gains or loses unsaved changes. */
	onDirtyChange?: ( isDirty: boolean ) => void;
	/** Called when a switch flips, so the host can track it. */
	onToggle?: ( setting: string, enabled: boolean ) => void;
};

export type CommentFormSettings = {
	comments: boolean;
	jetpack_comments_images: boolean;
	jetpack_comments_embeds: boolean;
	highlander_comment_form_prompt: string;
};

declare global {
	interface Window {
		/** The settings data from PHP, and the card the bundle adds for Jetpack's Discussion settings. */
		jetpackCommentsSettings?: SettingsData & { CommentFormSettings?: ComponentType< HostProps > };
	}
}
