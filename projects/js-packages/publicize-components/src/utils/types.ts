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
