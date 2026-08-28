/**
 * Welcome guide entry point.
 *
 * The guide ships as its own bundle rather than riding along in the form
 * editor's. Not for load order — both are classic footer scripts and this one
 * is registered second, so it runs after that bundle either way — but for
 * reach: the editor bundle loads on every block editor screen, because
 * in-editor navigation can drop a user into a form without another page load.
 * Riding along would ship the guide's code, copy and styles to every post and
 * page editor on the site, for a modal that only ever opens on one screen.
 *
 * PHP only enqueues this on the form post type, so there is no post type check
 * here; see Form_Editor::enqueue_admin_scripts().
 */

import { registerPlugin } from '@wordpress/plugins';
import { FormWelcomeGuide, JETPACK_FORM_WELCOME_GUIDE } from './index';

registerPlugin( JETPACK_FORM_WELCOME_GUIDE, {
	render: FormWelcomeGuide,
} );
