import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MeasurableImage, type Dimensions, type FetchFn, type Weight } from './MeasurableImage.ts';
import ImageGuideAnalytics, { type TracksCallback } from './analytics.ts';
import { getMeasurableImages } from './find-image-elements.ts';
import { setupLoadListener } from './initialize.ts';
import { AdminBarToggle } from './ui/React.tsx';

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
 * @param {HTMLElement} target              - The parent element to mount the UI in.
 * @param {object}      args                - The arguments to pass to the UI.
 * @param {string}      args.href           - The URL to the image guide.
 * @param {Function}    args.tracksCallback - The callback to call when tracking an event.
 * @param {Function}    args.fetchFunction  - The function to use to fetch the image weight.
 * @return {object} An idempotent unmount handle for the toolbar UI.
 */
export function setupImageGuideUI(
	target: HTMLElement,
	{ href, tracksCallback, fetchFunction }: ImageGuideUIOptions
) {
	ImageGuideAnalytics.setTracksCallback( tracksCallback );
	setupLoadListener( fetchFunction );
	const wrapper = document.createElement( 'div' );
	wrapper.style.display = 'contents';
	target.append( wrapper );
	const root = createRoot( wrapper );
	root.render( createElement( AdminBarToggle, { href } ) );
	let mounted = true;
	return {
		unmount() {
			if ( ! mounted ) return;
			mounted = false;
			root.unmount();
			wrapper.remove();
		},
	};
}
