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

type Mount = {
	/*
	 * What the host that mounted asked for.
	 */
	options: Contract.WhatsNewOptions;
};

let ready: Promise< void > | undefined;
let root: ReturnType< typeof createRoot > | undefined;
let container: HTMLElement | undefined;
let current: Mount | undefined;

/**
 * Renders the surface of the current mount, creating its root on the first call.
 *
 * The root hangs from `#wpbody`, the box the teaser is placed against. It cannot be a child of
 * `#wpbody-content`, where a wp-build page hides everything but its own app.
 */
function render(): void {
	// The host left while the translations were loading.
	if ( ! current ) {
		return;
	}

	if ( ! root ) {
		container = document.createElement( 'div' );
		container.id = 'jetpack-whats-new';
		( document.getElementById( 'wpbody' ) ?? document.body ).append( container );
		root = createRoot( container );
	}

	root.render( createElement( WhatsNew, { channels: current.options.channels } ) );
}

/**
 * Takes the surface off the page, unless a later mount owns it by now.
 *
 * @param mount - The mount whose host asks.
 */
function unmount( mount: Mount ): void {
	if ( current !== mount ) {
		return;
	}

	current = undefined;
	root?.unmount();
	root = undefined;
	container?.remove();
	container = undefined;
}

/**
 * Mounts the What's new surface on the page, or updates the one already mounted.
 *
 * The first call loads the translations of the surface and registers its entity.
 *
 * @param options - The options.
 * @return The function that takes the surface off the page.
 */
export const mountWhatsNew: typeof Contract.mountWhatsNew = options => {
	const mount: Mount = { options };

	current = mount;
	ready ??= loadTranslations().then( ensureAnnouncementEntity );
	void ready.then( render );

	return () => unmount( mount );
};
