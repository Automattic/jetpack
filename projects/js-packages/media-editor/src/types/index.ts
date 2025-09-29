/**
 * WordPress dependencies
 */
import type { Attachment, Updatable } from '@wordpress/core-data';

type MediaKind = 'image' | 'video' | 'audio' | 'application';

export interface MediaType {
	type: MediaKind;
	label: string;
	icon: JSX.Element;
}

export interface MediaItem extends Attachment< 'edit' > {
	// featured_media is not in the Attachment type. See https://github.com/WordPress/gutenberg/blob/trunk/packages/core-data/src/entity-types/attachment.ts#L10
	featured_media: number;
	_links: {
		post: {
			post_type: string;
			id: number;
			title: string;
			href: string;
			embeddable: boolean;
		}[];
	};
}

export type MediaItemUpdatable = Updatable< Attachment >;
