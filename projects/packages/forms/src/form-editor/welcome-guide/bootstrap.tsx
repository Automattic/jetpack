/**
 * Welcome guide entry point.
 *
 * The guide ships as its own bundle rather than riding along in the form
 * editor's. That bundle is large, and the guide is one of the first things a
 * new user sees, so waiting for the whole editor to download and parse before
 * the guide could even register left the modal — and its artwork — arriving
 * noticeably late. Loading separately lets it register as soon as the editor
 * APIs it depends on are available.
 *
 * PHP only enqueues this on the form post type, so there is no post type check
 * here; see Form_Editor::enqueue_admin_scripts().
 */

import { registerPlugin } from '@wordpress/plugins';
import { FormWelcomeGuide, JETPACK_FORM_WELCOME_GUIDE } from './index';

registerPlugin( JETPACK_FORM_WELCOME_GUIDE, {
	render: FormWelcomeGuide,
} );
