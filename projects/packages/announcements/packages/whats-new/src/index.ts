/**
 * External dependencies
 */
import { createElement, createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { WhatsNew } from './components';
import { ensureAnnouncementEntity } from './hooks';
import { loadTranslations } from './load-translations';
import type * as Contract from '@automattic/jetpack-announcements';

let ready: Promise< void > | undefined;
let root: ReturnType< typeof createRoot > | undefined;
let latestOptions: Contract.WhatsNewOptions;

/**
 * Renders the surface with the latest options, creating its root on the first call.
 *
 * The root hangs from `#wpbody`, the box the teaser is placed against. It cannot be a child of
 * `#wpbody-content`, where a wp-build page hides everything but its own app.
 */
function render(): void {
	if ( ! root ) {
		const container = document.createElement( 'div' );
		container.id = 'jetpack-whats-new';
		( document.getElementById( 'wpbody' ) ?? document.body ).append( container );
		root = createRoot( container );
	}

	root.render( createElement( WhatsNew, { channels: latestOptions.channels } ) );
}

/**
 * Mounts the What's new surface on the page, or updates the one already mounted.
 *
 * The first call loads the translations of the surface and registers its entity.
 *
 * @param options - The options.
 */
export const mountWhatsNew: typeof Contract.mountWhatsNew = options => {
	latestOptions = options;
	ready ??= loadTranslations().then( ensureAnnouncementEntity );

	void ready.then( render );
};
