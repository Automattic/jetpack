import type { FilterObject } from '../../components/video-filter/types';
import type { AdminVideo, LocalVideo } from '../../types';

type VideosResult = {
	items: AdminVideo[];
	uploading: AdminVideo[];
	isUploading: boolean;
	search: string;
	filter: FilterObject;
	uploadedVideoCount: number;
	isFetching: boolean;
	isFetchingUploadedVideoCount: boolean;
	firstUploadedVideoId: number | string;
	firstVideoProcessed: boolean;
	dismissedFirstVideoPopover: boolean;
	page: number;
	itemsPerPage: number;
	total: number;
	storageUsed: number;
	uploadErrors: AdminVideo[];
	setPage: ( page: number ) => void;
	setSearch: ( search: string ) => void;
	setFilter: ( filter: string, value: number | string, isActive: boolean ) => void;
};

type LocalVideosResult = {
	items: LocalVideo[];
	uploadedLocalVideoCount: number;
	isFetching: boolean;
	page: number;
	itemsPerPage: number;
	total: number;
	setPage: ( page: number ) => void;
};

export default function useVideos(): VideosResult;
export function useLocalVideos(): LocalVideosResult;
export function useVideosQuery(): Record< string, unknown >;
