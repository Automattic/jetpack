import {
	audio,
	background,
	backup,
	brush,
	caution,
	check,
	cloud,
	cog,
	comment,
	commentAuthorAvatar,
	connection,
	customPostType,
	error,
	globe,
	homeButton,
	image,
	layout,
	lock,
	menu,
	pages,
	people,
	postContent,
	plugins,
	published,
	receipt,
	rotateRight,
	swatch,
	trash,
	update,
	video,
	wordpress,
} from '@wordpress/icons';
import type { ReactElement } from 'react';

const icons: Record< string, ReactElement > = {
	audio,
	checkmark: check,
	cart: receipt,
	cloud,
	cog,
	comment,
	'custom-post-type': customPostType,
	globe,
	history: backup,
	image,
	layout,
	lock,
	menu,
	'multiple-users': people,
	'my-sites': wordpress,
	notice: caution,
	posts: postContent,
	pages,
	plans: connection,
	plugins,
	published,
	rotateRight,
	science: swatch,
	spam: error,
	status: homeButton,
	sync: update,
	themes: brush,
	trash,
	user: commentAuthorAvatar,
	video,
};

/**
 * Translate a Calypso gridicon slug (as returned by the WPCOM activity log
 * in `entry.gridicon`) into a `@wordpress/icons` element. Falls back to the
 * generic `background` icon for unknown slugs.
 *
 * @param slug - The gridicon slug (e.g. "plugins", "posts", "cloud").
 * @return The corresponding WP icon element.
 */
export function gridiconToWordPressIcon( slug: string ): ReactElement {
	return icons[ slug ] ?? background;
}
