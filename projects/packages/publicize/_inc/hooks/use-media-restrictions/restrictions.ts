/**
 * These restrictions were updated on: March 13, 2026.
 *
 * Image and video size is in MB.
 * Video length is in seconds.
 */
const MP4 = 'video/mp4';
const MOV = 'video/mov';
const VIDEOPRESS = 'video/videopress';
const allowedImageTypes = [ 'image/jpeg', 'image/jpg', 'image/png' ];
const facebookImageTypes = allowedImageTypes.concat( [
	'image/gif',
	// We do not support tiff image, because WordPress Core cannot display it.
	// 'image/tiff',
	// 'image/tif',
	'image/bmp',
] );
const facebookVideoTypes = [
	'video/3g2',
	'video/3gp',
	'video/3gpp',
	'video/asf',
	'video/avi',
	'video/dat',
	'video/divx',
	'video/dv',
	'video/f4v',
	'video/flv',
	'video/gif',
	'video/m2ts',
	'video/m4v',
	'video/mkv',
	'video/mod',
	'video/mov',
	'video/mp4',
	'video/mpe',
	'video/mpeg',
	'video/mpeg4',
	'video/mpg',
	'video/mts',
	'video/nsv',
	'video/ogm',
	'video/ogv',
	'video/qt',
	'video/tod',
	'video/ts',
	'video/vob',
	'video/wmv',
];
const mastodonImageTypes = allowedImageTypes.concat( [
	'image/gif',
	'image/heic',
	'image/heif',
	'image/webp',
	'image/avif',
] );
const mastodonVideoTypes = [ 'video/webm', 'video/quicktime', 'video/ogg' ];
const nextdoorImageTypes = allowedImageTypes.concat( [
	'image/gif',
	'image/jpe',
	'image/tif',
	'image/tiff',
	'image/webp',
] );
const nextdoorVideoTypes = [ MOV, 'video/avi', 'video/mpg', 'video/mpeg', 'video/m4v' ];

// Global max size: 100 GB;
export const GLOBAL_MAX_SIZE = 100000;

export const DEFAULT_RESTRICTIONS = {
	requiresMedia: false,
	allowedMediaTypes: allowedImageTypes.concat( [ MP4, VIDEOPRESS, MOV ] ),
	image: {
		maxSize: 4,
		minWidth: 0,
		maxWidth: GLOBAL_MAX_SIZE,
		aspectRatio: {
			min: 0,
			max: GLOBAL_MAX_SIZE,
		},
	},
	video: {
		minLength: 0,
		minSize: 0,
		maxSize: GLOBAL_MAX_SIZE,
		maxLength: GLOBAL_MAX_SIZE,
		maxWidth: GLOBAL_MAX_SIZE,
		aspectRatio: {
			min: 0,
			max: GLOBAL_MAX_SIZE,
		},
	},
	charLimit: 255,
};

export const RESTRICTIONS = {
	// https://docs.bsky.app/docs/advanced-guides/posts#images-and-media
	bluesky: {
		allowedMediaTypes: allowedImageTypes.concat( [
			MP4,
			VIDEOPRESS,
			MOV,
			'video/webm',
			'video/mpeg',
		] ),
		image: {
			maxSize: 1,
		},
		video: {
			maxSize: 10000,
			maxLength: 60,
		},
		charLimit: 300,
	},
	// https://developers.facebook.com/docs/graph-api/reference/photo/
	// https://developers.facebook.com/docs/video-api/guides/publishing
	facebook: {
		allowedMediaTypes: facebookImageTypes.concat( [ VIDEOPRESS, ...facebookVideoTypes ] ),
		image: {
			maxSize: 10,
		},
		video: {
			maxSize: 10000,
			maxLength: 14400,
		},
		charLimit: 10000,
	},
	// https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing
	'instagram-business': {
		requiresMedia: true,
		allowedMediaTypes: [ 'image/jpg', 'image/jpeg', MP4, MOV, VIDEOPRESS ],
		image: {
			maxSize: 8,
			minWidth: 320,
			maxWidth: 1440,
			aspectRatio: {
				min: 4 / 5,
				max: 1.91,
			},
		},
		video: {
			maxLength: 900,
			minLength: 3,
			maxSize: 1000,
			maxWidth: 1920,
			aspectRatio: {
				min: 0.01,
				max: 10,
			},
		},
		charLimit: 2200,
	},
	// https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api
	// https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api
	linkedin: {
		allowedMediaTypes: allowedImageTypes.concat( [ 'image/gif', MP4, VIDEOPRESS ] ),
		image: {
			maxSize: 20,
		},
		video: {
			minSize: 0.075,
			maxSize: 500,
			maxLength: 1800,
			minLength: 3,
		},
		charLimit: 3000,
	},
	// https://docs.joinmastodon.org/user/posting/#media
	mastodon: {
		allowedMediaTypes: mastodonImageTypes.concat( [
			...mastodonVideoTypes,
			MP4,
			'video/m4v',
			MOV,
			VIDEOPRESS,
		] ),
		image: {
			maxSize: 16,
		},
		video: {
			maxSize: 99,
		},
		charLimit: 500,
	},
	// https://developer.nextdoor.com/reference/media-upload
	nextdoor: {
		allowedMediaTypes: nextdoorImageTypes.concat( [ ...nextdoorVideoTypes, MP4, VIDEOPRESS ] ),
		image: {
			maxSize: 10,
		},
		video: {
			maxSize: 500,
		},
		charLimit: 10000,
	},
	// https://www.tumblr.com/docs/en/api/v2
	tumblr: {
		allowedMediaTypes: allowedImageTypes.concat( [ MP4, MOV, VIDEOPRESS ] ),
		image: {
			maxSize: 20,
		},
		video: {
			maxSize: 500,
			maxLength: 600,
		},
		charLimit: 4096,
	},
};

/**
 * These types are supported by Photon, and can be converted. Any other type will be treated as invalid.
 */
export const PHOTON_CONVERTIBLE_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	// We do not support tiff image, because WordPress Core cannot display it.
	// 'image/tiff',
	// 'image/tif',
	'image/heic',
	'image/heif',
	'image/webp',
];

/**
 * These are the types that can be selected in the media picker.
 * Contains all the allowed types, plus the Photon convertible types, plus the videos.
 */
export const SELECTABLE_MEDIA_TYPES = [
	...new Set( [
		...allowedImageTypes,
		...facebookImageTypes,
		...mastodonImageTypes,
		...facebookVideoTypes,
		...mastodonVideoTypes,
		...PHOTON_CONVERTIBLE_TYPES,
	] ),
];
