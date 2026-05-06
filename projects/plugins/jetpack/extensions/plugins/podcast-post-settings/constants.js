import { __ } from '@wordpress/i18n';

export const META_PODCAST_AUDIO_URL = '_jetpack_podcast_audio_url';
export const META_PODCAST_AUDIO_MIME = '_jetpack_podcast_audio_mime';
export const META_PODCAST_AUDIO_SIZE = '_jetpack_podcast_audio_size';
export const META_PODCAST_DURATION = '_jetpack_podcast_duration';
export const META_PODCAST_EPISODE_TITLE = '_jetpack_podcast_episode_title';
export const META_PODCAST_EPISODE_SUMMARY = '_jetpack_podcast_episode_summary';
export const META_PODCAST_EPISODE_NUMBER = '_jetpack_podcast_episode_number';
export const META_PODCAST_SEASON_NUMBER = '_jetpack_podcast_season_number';
export const META_PODCAST_EPISODE_TYPE = '_jetpack_podcast_episode_type';
export const META_PODCAST_EXPLICIT = '_jetpack_podcast_explicit';
export const META_PODCAST_BLOCK = '_jetpack_podcast_block';

export const EPISODE_TYPE_OPTIONS = [
	{ label: __( 'Full episode', 'jetpack' ), value: 'full' },
	{ label: __( 'Trailer', 'jetpack' ), value: 'trailer' },
	{ label: __( 'Bonus', 'jetpack' ), value: 'bonus' },
];

export const EXPLICIT_OPTIONS = [
	{ label: __( 'Clean', 'jetpack' ), value: 'clean' },
	{ label: __( 'Explicit', 'jetpack' ), value: 'yes' },
	{ label: __( 'Not specified', 'jetpack' ), value: '' },
];
