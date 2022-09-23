/*
 * STORE
 */
export const STORE_ID = 'videopress/media';

/*
 * API
 */
export const WP_ADMIN_AJAX_API_URL = '/wp-admin/admin-ajax.php';
export const WP_REST_API_MEDIA_ENDPOINT = 'wp/v2/media';
export const WP_REST_API_VIDEOPRESS_META_ENDPOINT = 'wpcom/v2/videopress/meta';

/*
 * Actions
 */
export const SET_IS_FETCHING_VIDEOS = 'SET_IS_FETCHING_VIDEOS';
export const SET_VIDEOS_FETCH_ERROR = 'SET_VIDEOS_FETCH_ERROR';
export const SET_VIDEOS_QUERY = 'SET_VIDEOS_QUERY';
export const SET_VIDEOS_PAGINATION = 'SET_VIDEOS_PAGINATION';
export const SET_VIDEOS = 'SET_VIDEOS';
export const SET_VIDEO = 'SET_VIDEO';
export const SET_IS_FETCHING_UPLOADED_VIDEO_COUNT = 'SET_IS_FETCHING_UPLOADED_VIDEO_COUNT';
export const SET_UPLOADED_VIDEO_COUNT = 'SET_UPLOADED_VIDEO_COUNT';

/*
 * Video Privacy Levels
 */
export const VIDEO_PRIVACY_LEVEL_PUBLIC = 'public';
export const VIDEO_PRIVACY_LEVEL_PRIVATE = 'private';
export const VIDEO_PRIVACY_LEVEL_SITE_DEFAULT = 'site-default';

export const VIDEO_PRIVACY_LEVELS = [
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
];
