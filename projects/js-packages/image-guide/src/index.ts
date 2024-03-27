import { Dimensions, FetchFn, MeasurableImage, Weight } from './MeasurableImage.js';
import { TracksCallback } from './analytics.js';
import { getMeasurableImages } from './find-image-elements.js';
import { setupLoadListener } from './initialize.js';
import AdminBarToggle from './ui/AdminBarToggle.svelte';

export { MeasurableImage, getMeasurableImages };
export type { Weight, Dimensions };

type ImageGuideUIOptions = {
	href: string;
	tracksCallback: TracksCallback;
	fetchFunction: FetchFn;
};

/**
 * Set up the Image Guide UI in the given target parent.
 *
 * @param {string}   target              - The parent element to mount the UI in.
 * @param {object}   args                - The arguments to pass to the UI.
 * @param {string}   args.href           - The URL to the image guide.
 * @param {Function} args.tracksCallback - The callback to call when tracking an event.
 * @param {Function} args.fetchFunction  - The function to use to fetch the image weight.
 * @return {object} The Svelte component instance.
 */
export function setupImageGuideUI(
	target: HTMLElement,
	{ href, tracksCallback, fetchFunction }: ImageGuideUIOptions
) {
	setupLoadListener( fetchFunction );

	return new AdminBarToggle( {
		target,
		props: {
			href,
			tracksCallback,
		},
	} );
}
