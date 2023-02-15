import { VideoGUID } from '../../block-editor/blocks/video/types';

export type VideoChapter = {
	src: string;
};

export type GetChapterArgs = {
	guid?: VideoGUID;
	token?: string;
	chapter?: VideoChapter;
	isPrivate: boolean;
};
