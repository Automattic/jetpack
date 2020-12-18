/**
 * Internal dependencies
 */
import './shared/public-path';
import './shared/block-category';
import './shared/plan-upgrade-notification';
import './shared/stripe-connection-notification';
import './shared/external-media';
import './extended-blocks/core-embed';
import './extended-blocks/paid-blocks';
import './shared/styles/slideshow-fix.scss';

import './store';

import analytics from '../_inc/client/lib/analytics';

// @TODO Please make a shared analytics solution and remove this!
if (
	typeof window === 'object' &&
	typeof window.Jetpack_Editor_Initial_State === 'object' &&
	typeof window.Jetpack_Editor_Initial_State.tracksUserData === 'object' &&
	typeof window.Jetpack_Editor_Initial_State.wpcomBlogId !== 'undefined'
) {
	const { userid, username } = window.Jetpack_Editor_Initial_State.tracksUserData;
	analytics.initialize( userid, username, {
		blog_id: window.Jetpack_Editor_Initial_State.wpcomBlogId,
	} );
}
