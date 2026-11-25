/**
 * External dependencies
 */
import { createElement, createRoot } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { WhatsNew } from './components';
import { ensureAnnouncementEntity } from './hooks';
import type * as Contract from '@automattic/jetpack-announcements';

export { useTeaserSwitch } from './hooks';
export { trackWhatsNew } from './utils';

type Mount = {
	/*
	 * What the host that mounted asked for.
	 */
	options: Parameters< typeof Contract.mountWhatsNew >[ 0 ];
};

const DOM_ELEMENT_ID = 'jetpack-whats-new';

let root: ReturnType< typeof createRoot > | undefined;
let container: HTMLElement | undefined;
let current: Mount | undefined;

/**
 * Renders the surface a mount asked for, creating its root on the first call.
 *
 * The root hangs from `#wpbody`, the box the teaser is placed against. It cannot be a child of
 * `#wpbody-content`, where a wp-build page hides everything but its own app.
 *
 * @param mount - The mount to render.
 */
function render( mount: Mount ): void {
	if ( ! root ) {
		container = document.createElement( 'div' );
		container.id = DOM_ELEMENT_ID;
		( document.getElementById( 'wpbody' ) ?? document.body ).append( container );
		root = createRoot( container );
	}

	root.render( createElement( WhatsNew, { channels: mount.options.channels } ) );
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
 * The first call registers the entity of the announcements.
 *
 * @param options - The options.
 * @return The function that takes the surface off the page.
 */
export const mountWhatsNew: typeof Contract.mountWhatsNew = options => {
	const mount: Mount = { options };

	current = mount;
	ensureAnnouncementEntity();
	render( mount );

	return () => unmount( mount );
};
