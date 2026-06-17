export type SIGSettings = {
	enabled: boolean;
	custom_text?: string;
	image_type?: string;
	image_id?: number;
	template?: string;
	token?: string;
	default_image_id?: number;
};

export type AttachedMedia = {
	id: number;
	type: string;
	url: string;
};

export type MediaSourceValue = 'featured-image' | 'sig' | 'media-library' | 'upload-video' | 'none';

/**
 * A focal point on an image, stored as attachment meta. Both axes are 0-1.
 */
export type FocalPoint = {
	x: number;
	y: number;
};

export type JetpackSocialOptions = {
	attached_media?: Array< AttachedMedia >;
	image_generator_settings?: SIGSettings;
	media_source?: MediaSourceValue;
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
	mediaSource: MediaSourceValue | undefined;
	shareMessage: string;
	togglePublicizeFeature: VoidFunction;
	updateMeta: < K extends keyof JetpackSocialPostMeta >(
		metaKey: K,
		metaValue: JetpackSocialPostMeta[ K ]
	) => void;
	updateJetpackSocialOptions: {
		// Single key-value update
		< K extends keyof JetpackSocialOptions >( key: K, value: JetpackSocialOptions[ K ] ): void;
		// Batch update with object
		( updates: Partial< JetpackSocialOptions > ): void;
	};
};
