export type SIGSettings = {
	template?: string;
	enabled: boolean;
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
