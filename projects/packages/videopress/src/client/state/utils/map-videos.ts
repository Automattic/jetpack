import { OriginalVideoPressVideo, VideoPressVideo } from '../types';

export const mapVideo = ( video: OriginalVideoPressVideo ): VideoPressVideo => {
	return {
		...video,
		title: video.title,
		posterImage: video.image?.src,
	};
};

export const mapVideos = ( videos: OriginalVideoPressVideo[] ): VideoPressVideo[] => {
	return videos.map( mapVideo );
};
