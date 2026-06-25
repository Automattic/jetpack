/**
 * Hand-written type surface for the `useVideos` hooks in `index.js`. Must be
 * kept in sync with that implementation until the hook is migrated to TS.
 */

import type { FilterObject } from '../../components/video-filter/types';
import type { AdminVideo, LocalVideo } from '../../types';

type VideosQuery = {
	order: string;
	orderBy: string;
	itemsPerPage: number;
	page: number;
	type: string;
};

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
	order: string;
	orderBy: string;
	type: string;
	page: number;
	itemsPerPage: number;
	total: number;
	totalPages: number;
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
	totalPages: number;
	setPage: ( page: number ) => void;
};

export default function useVideos(): VideosResult;
export function useLocalVideos(): LocalVideosResult;
export function useVideosQuery(): VideosQuery;
