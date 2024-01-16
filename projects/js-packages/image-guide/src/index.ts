import { Dimensions, MeasurableImage, Weight } from './MeasurableImage';
import { TracksCallback } from './analytics';
import { getMeasurableImages } from './find-image-elements';
import AdminBarToggle from './ui/AdminBarToggle.svelte';

export { MeasurableImage, getMeasurableImages };
export type { Weight, Dimensions };

/**
 * Set up the Image Guide UI in the given target parent.
 *
 * @param {string} target           - The parent element to mount the UI in.
 * @param {string} href             - The URL to link to when the admin bar toggle is clicked.
 * @param {Function} tracksCallback - The callback to call when the admin bar toggle is clicked.
 * @returns The Svelte component instance.
 */
export function mountAdminBarToggle(
	target: HTMLElement,
	href: string,
	tracksCallback: TracksCallback
) {
	return new AdminBarToggle( {
		target,
		props: {
			href,
			tracksCallback,
		},
	} );
}
