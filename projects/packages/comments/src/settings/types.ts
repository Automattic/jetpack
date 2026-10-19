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

export type CommentFormSettings = {
	comments: boolean;
	enable_blocks_comments: boolean;
	jetpack_comments_images: boolean;
	jetpack_comments_embeds: boolean;
	highlander_comment_form_prompt: string;
};
