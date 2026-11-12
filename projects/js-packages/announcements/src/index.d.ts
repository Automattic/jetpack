/**
 * What a page imports to show the Jetpack Announcements surface.
 *
 * The Jetpack Announcements package registers the implementation at runtime as the
 * `@automattic/jetpack-announcements` script module; a host's build leaves imports of this
 * package external.
 */

export type WhatsNewOptions = {
	/*
	 * The contexts the host shows. An announcement is shown when it names one of them.
	 */
	contexts: string[];
};

/**
 * Mounts the What's new surface on the page, or updates the one already mounted.
 *
 * @param {WhatsNewOptions} options - The options.
 */
export declare function mountWhatsNew( options: WhatsNewOptions ): void;
