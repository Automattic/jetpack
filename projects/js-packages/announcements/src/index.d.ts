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

type TeaserSwitch = {
	/*
	 * Whether the teaser is on for the current user.
	 */
	isOn: boolean;

	/*
	 * Turns the teaser on or off. The switch is one for every host on the site.
	 */
	setIsOn: ( isOn: boolean ) => void;
};

/**
 * Reads and writes the switch that turns the teaser off for the current user.
 *
 * A React hook, for the control a host offers in its own settings. It works with or without
 * the surface mounted.
 *
 * @return {TeaserSwitch} Whether the teaser is on, and the function that turns it on or off.
 */
export declare function useTeaserSwitch(): TeaserSwitch;

// Without this, a declaration file exports every top-level name, the types above included.
export {};
