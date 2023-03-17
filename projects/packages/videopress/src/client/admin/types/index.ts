/* Shared Types */
export type OriginalVideoPressVideo = {
	/**
	 * Video ID
	 */
	id: number | string;
	/**
	 * Video Slug
	 */
	slug: string;
	/**
	 * Video Media Details
	 */
	media_details: {
		/**
		 * Media width.
		 */
		width: number;
		/**
		 * Media height.
		 */
		height: number;
		/**
		 * Media length.
		 */
		length: number;
		/**
		 * Data related specific with videopress.
		 */
		videopress: {
			/**
			 * Video Original URL.
			 */
			original: string;
			/**
			 * Poster image URL.
			 */
			poster: string;
			/**
			 * Video uploaded date in UTC
			 */
			upload_date: string;
			/**
			 * Video duration, in milliseconds
			 */
			duration: number;
			/**
			 * Whether the video is private, or not.
			 */
			is_private: boolean;
			/**
			 * Video is uploading
			 */
			finished: boolean;
			/**
			 * Video poster files
			 */
			files?: {
				/**
				 * Poster data for dvd resolution.
				 */
				dvd: {
					/**
					 * DVD resolution poster image
					 */
					original_img: string;
				};
			};
			/**
			 * Whether the video is private, or not.
			 */
			file_url_base: {
				/**
				 * HTTP Base URL.
				 */
				http: string;
				/**
				 * HTTPS Base URL.
				 */
				https: string;
			};
		};
	};
	jetpack_videopress: {
		/**
		 * Video title
		 */
		title: string;
		/**
		 * Video description
		 */
		description: string;
		/**
		 * Video caption
		 */
		caption: string;
		/**
		 * Video rating
		 */
		rating?: 'G' | 'PG-13' | 'R-17';
		/**
		 * Whether it is possible to download the video or not.
		 */
		allow_download?: boolean;
		/**
		 * Whether the video sharing menu is enabled or not.
		 */
		display_embed?: boolean;
		/**
		 * Video privacy setting:
		 * - 0 `public`: anyone can view the video
		 * - 1 `private`: only the owner can view the video
		 * - 2 `site-default`
		 */
		privacy_setting?: 0 | 1 | 2;
		/**
		 * If a playback token is needed when fetching the video
		 * resources, taking the video privacy setting and the
		 * VideoPress site privacy setting into account.
		 */
		needs_playback_token?: boolean;
		/**
		 * If the video is private, considering the video and the site
		 * privacy settings.
		 */
		is_private?: boolean;
		/**
		 * If the site video default privacy setting is private.
		 */
		private_enabled_for_site?: boolean;
	};
	/**
	 * Video source URL
	 */
	source_url: string;
	/**
	 * Video date
	 */
	date: string;
	/**
	 * Video guid
	 */
	jetpack_videopress_guid: string;
};

export type VideoPressVideo = {
	width?: OriginalVideoPressVideo[ 'media_details' ][ 'width' ];
	height?: OriginalVideoPressVideo[ 'media_details' ][ 'height' ];
	id: OriginalVideoPressVideo[ 'id' ];
	guid?: OriginalVideoPressVideo[ 'jetpack_videopress_guid' ];
	title: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'title' ];
	description: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'description' ];
	caption: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'caption' ];
	url: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'original' ];
	uploadDate: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'upload_date' ];
	duration: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'duration' ];
	isPrivate?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'is_private' ];
	posterImage?: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'poster' ];
	allowDownload?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'allow_download' ];
	displayEmbed?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'display_embed' ];
	rating?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'rating' ];
	privacySetting?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'privacy_setting' ];
	needsPlaybackToken?: OriginalVideoPressVideo[ 'jetpack_videopress' ][ 'needs_playback_token' ];
	poster?: {
		src: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'poster' ];
	};
	finished?: OriginalVideoPressVideo[ 'media_details' ][ 'videopress' ][ 'finished' ];
	filename?: string;
	thumbnail?: string;
	uploading?: boolean;
	plays?: number; // Not provided yet
};

export type LocalVideo = {
	/**
	 * Video ID
	 */
	id: number | string;
	/**
	 * Video title
	 */
	title: string;
	/**
	 * Video description
	 */
	description: string;
	/**
	 * Video caption
	 */
	caption: string;
	/**
	 * Media width.
	 */
	width: number;
	/**
	 * Media height.
	 */
	height: number;
	/**
	 * Video URL.
	 */
	url: string;
	/**
	 * Video uploaded date
	 */
	uploadDate: string;
	/**
	 * Video duration, in milliseconds
	 */
	duration: number;
	/**
	 * Flag to indicate if the video is already uploaded or not to VideoPress.
	 */
	isUploadedToVideoPress: boolean;
	/**
	 * The video error, if any.
	 */
	readError?: 0 | 1 | 2;
};

export type MetadataVideo = {
	id: number | string;
	deletedVideo?: VideoPressVideo;
	isDeleting?: boolean;
	hasBeenDeleted?: boolean;
	uploading?: boolean;
	processing?: boolean;
	isUpdatingPrivacy?: boolean;
	isUpdatingPoster?: boolean;
	uploadProgress?: number;
};

export type SiteType = 'atomic' | 'jetpack' | 'simple';

export type VideoPressSettings = {
	videoPressVideosPrivateForSite: boolean;
	siteIsPrivate: boolean;
	siteType: SiteType;
};

export type VideopressSelectors = {
	isFetchingPurchases: () => boolean;
	getVideo: ( id: number | string, addAtEnd: boolean ) => VideoPressVideo;
	getVideoStateMetadata: ( id: number | string ) => MetadataVideo; // @todo use specific type
	getVideos: () => VideoPressVideo[];
	getUploadedVideoCount: () => number;
	getFirstUploadedVideoId: () => number;
	getFirstVideoProcessed: () => boolean;
	getDismissedFirstVideoPopover: () => boolean;
	getIsFetching: () => boolean;
	getPurchases: () => Array< object >;

	getPlaybackToken: ( guid: string ) => { guid: string; token: string };
	isFetchingPlaybackToken: () => boolean;

	getUploadedLocalVideoCount: () => number;

	getVideoPressSettings: () => VideoPressSettings;
};
