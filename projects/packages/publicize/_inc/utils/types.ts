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

export type FocalPoint = {
	x: number;
	y: number;
};

/**
 * One focal point per image, keyed by attachment ID. Consumers look up the
 * image they are processing; a missing key means unset.
 */
export type ImageFocalPoints = Record< number, FocalPoint >;

export type JetpackSocialOptions = {
	attached_media?: Array< AttachedMedia >;
	image_generator_settings?: SIGSettings;
	media_source?: MediaSourceValue;
	image_focal_points?: ImageFocalPoints;
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
	imageFocalPoints: ImageFocalPoints;
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
	updateImageFocalPoint: ( attachmentId: number, point: FocalPoint ) => void;
};
