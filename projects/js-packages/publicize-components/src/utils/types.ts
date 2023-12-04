export type SIGSettings = {
	enabled: boolean;
	custom_text?: string;
	image_type?: string;
	image_id?: number;
	template?: string;
	token?: string;
};

export type AttachedMedia = {
	id: number;
	type: string;
	url: string;
};

export type JetpackSocialOptions = {
	attached_media?: Array< AttachedMedia >;
	image_generator_settings?: SIGSettings;
	should_upload_attached_media?: boolean;
};

export type JetpackSocialPostMeta = {
	jetpack_publicize_message?: string;
	jetpack_publicize_feature_enabled?: boolean;
	jetpack_social_post_already_shared?: boolean;
	jetpack_social_options?: JetpackSocialOptions;
};

export type UsePostMeta = {
	attachedMedia: Array< AttachedMedia >;
	imageGeneratorSettings: SIGSettings;
	isPostAlreadyShared: boolean;
	isPublicizeEnabled: boolean;
	jetpackSocialOptions: JetpackSocialOptions;
	shareMessage: string;
	shouldUploadAttachedMedia: boolean;
	togglePublicizeFeature: VoidFunction;
	updateMeta: < K extends keyof JetpackSocialPostMeta >(
		metaKey: K,
		metaValue: JetpackSocialPostMeta[ K ]
	) => void;
	updateJetpackSocialOptions: < K extends keyof JetpackSocialOptions >(
		key: K,
		value: JetpackSocialOptions[ K ]
	) => void;
};
