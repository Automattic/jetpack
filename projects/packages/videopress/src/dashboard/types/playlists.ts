import type {
	PlaylistEntry,
	PlaylistDisplayAttributes,
} from '../../client/block-editor/blocks/playlist/types';

export type { PlaylistEntry };

/** The post status of the post a playlist is in. */
export type PlaylistStatus = 'publish' | 'future' | 'draft' | 'pending' | 'private';

/** The block's display and playback settings the dashboard edits. */
export type PlaylistSettings = PlaylistDisplayAttributes & {
	showPlaylistTitle: boolean;
};

/** A Video Playlist block in the site's content, as the playlists routes return it. */
export interface PlaylistItem {
	key: string;
	title: string;
	description: string;
	videos: PlaylistEntry[];
	videoCount: number;
	durationMs: number;
	updated: string;
	status: PlaylistStatus;
	settings: PlaylistSettings;
	post: {
		id: number;
		title: string;
		type: string;
		typeLabel: string;
		editUrl: string;
	};
	url: string;
	canEdit: boolean;
	canPublish: boolean;
}

/** Changes a playlist update can carry. */
export type PlaylistPatch = Partial< Pick< PlaylistItem, 'title' | 'description' | 'videos' > > & {
	settings?: Partial< PlaylistSettings >;
	status?: 'publish' | 'draft';
};

/** What a new playlist is created with. */
export type PlaylistCreate = PlaylistPatch & {
	postType?: 'page' | 'post';
};

/** The delete route's answer. */
export interface PlaylistDeleteResult {
	deleted: boolean;
	postTrashed: boolean;
	previous: PlaylistItem;
}
