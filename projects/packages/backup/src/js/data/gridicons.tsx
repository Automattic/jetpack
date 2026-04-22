/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

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
 *
 * @param slug
 */
export function gridiconToWordPressIcon( slug: string ): ReactElement {
	return icons[ slug ] ?? background;
}
