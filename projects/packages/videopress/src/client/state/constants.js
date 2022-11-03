/*
 * STORE
 */
export const STORE_ID = 'videopress/media';

/*
 * API
 */
export const WP_ADMIN_AJAX_API_URL = '/wp-admin/admin-ajax.php';
export const WP_REST_API_USERS_ENDPOINT = 'wp/v2/users';
export const WP_REST_API_MEDIA_ENDPOINT = 'wp/v2/media';
export const WP_REST_API_VIDEOPRESS_ENDPOINT = 'wpcom/v2/videopress';
export const WP_REST_API_VIDEOPRESS_META_ENDPOINT = 'wpcom/v2/videopress/meta';
export const WP_REST_API_VIDEOPRESS_PLAYBACK_TOKEN_ENDPOINT = 'wpcom/v2/videopress/playback-jwt';
export const REST_API_SITE_PURCHASES_ENDPOINT = 'my-jetpack/v1/site/purchases';
export const REST_API_SITE_INFO_ENDPOINT = 'videopress/v1/site';

/*
 * Actions
 */
export const SET_IS_FETCHING_VIDEOS = 'SET_IS_FETCHING_VIDEOS';
export const SET_VIDEOS_FETCH_ERROR = 'SET_VIDEOS_FETCH_ERROR';
export const SET_VIDEOS_QUERY = 'SET_VIDEOS_QUERY';
export const SET_VIDEOS_PAGINATION = 'SET_VIDEOS_PAGINATION';
export const SET_VIDEOS = 'SET_VIDEOS';
export const SET_VIDEOS_STORAGE_USED = 'SET_VIDEOS_STORAGE_USED';
export const SET_UPLOADED_VIDEO_COUNT = 'SET_UPLOADED_VIDEO_COUNT';
export const SET_IS_FETCHING_UPLOADED_VIDEO_COUNT = 'SET_IS_FETCHING_UPLOADED_VIDEO_COUNT';

export const SET_LOCAL_VIDEOS = 'SET_LOCAL_VIDEOS';
export const SET_IS_FETCHING_LOCAL_VIDEOS = 'SET_IS_FETCHING_LOCAL_VIDEOS';
export const SET_LOCAL_VIDEOS_QUERY = 'SET_LOCAL_VIDEOS_QUERY';
export const SET_LOCAL_VIDEOS_PAGINATION = 'SET_LOCAL_VIDEOS_PAGINATION';
export const SET_LOCAL_VIDEO_UPLOADED = 'SET_LOCAL_VIDEO_UPLOADED';
export const SET_VIDEOS_FILTER = 'SET_VIDEOS_FILTER';

export const SET_VIDEO = 'SET_VIDEO';
export const SET_VIDEO_PRIVACY = 'SET_VIDEO_PRIVACY';
export const UPDATE_VIDEO_PRIVACY = 'UPDATE_VIDEO_PRIVACY';
export const DELETE_VIDEO = 'DELETE_VIDEO';
export const REMOVE_VIDEO = 'REMOVE_VIDEO';

export const UPLOADING_VIDEO = 'UPLOADING_VIDEO';
export const PROCESSING_VIDEO = 'PROCESSING_VIDEO';
export const UPLOADED_VIDEO = 'UPLOADED_VIDEO';
export const SET_VIDEO_UPLOAD_PROGRESS = 'SET_VIDEO_UPLOAD_PROGRESS';

export const SET_IS_FETCHING_PURCHASES = 'SET_IS_FETCHING_PURCHASES';
export const SET_PURCHASES = 'SET_PURCHASES';

export const SET_IS_FETCHING_PLAYBACK_TOKEN = 'SET_IS_FETCHING_PLAYBACK_TOKEN';
export const SET_PLAYBACK_TOKEN = 'SET_PLAYBACK_TOKEN';
export const EXPIRE_PLAYBACK_TOKEN = 'EXPIRE_PLAYBACK_TOKEN';

export const SET_USERS = 'SET_USERS';
export const SET_USERS_PAGINATION = 'SET_USERS_PAGINATION';

export const SET_UPDATING_VIDEO_POSTER = 'SET_UPDATING_VIDEO_POSTER';
export const UPDATE_VIDEO_POSTER = 'UPDATE_VIDEO_POSTER';

/*
 * Accepted file extensions
 */
export const VIDEO_EXTENSIONS = [ 'ogv', 'mp4', 'mov', 'wmv', 'avi', 'mpg', '3gp', '3g2', 'm4v' ];

/*
 * Video Privacy Levels
 */
export const VIDEO_PRIVACY_LEVEL_PUBLIC = 'public';
export const VIDEO_PRIVACY_LEVEL_PRIVATE = 'private';
export const VIDEO_PRIVACY_LEVEL_SITE_DEFAULT = 'site-default';

/*
 * Order is very important here.
 * The item index reflects the privacy_setting value
 * used to hit the /meta endpoint.
 */
export const VIDEO_PRIVACY_LEVELS = [
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
];
