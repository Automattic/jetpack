/**
 * What a page imports to show the Jetpack Announcements surface.
 *
 * The Jetpack Announcements package registers the implementation at runtime as the
 * `@automattic/jetpack-announcements` script module; a host's build leaves imports of this
 * package external.
 */

export type WhatsNewOptions = {
	/*
	 * The channels the host subscribes to. An announcement is shown when it is published to one of them.
	 */
	channels: string[];
};

/**
 * Mounts the What's new surface on the page, or updates the one already mounted.
 *
 * A page has one surface. A later call takes it over, and the function an earlier call
 * returned does nothing from then on.
 *
 * @param {WhatsNewOptions} options - The options.
 * @return {() => void} The function that takes the surface off the page.
 */
export declare function mountWhatsNew( options: WhatsNewOptions ): () => void;
