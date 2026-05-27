type VideosResult = {
	items: unknown[];
	uploading: unknown[];
	isUploading: boolean;
	search: string;
	filter: Record< string, unknown >;
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
	uploadErrors: unknown[];
	setPage: ( page: number ) => void;
	setSearch: ( search: string ) => void;
	setFilter: ( filter: Record< string, unknown > ) => void;
};

type LocalVideosResult = {
	items: unknown[];
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
