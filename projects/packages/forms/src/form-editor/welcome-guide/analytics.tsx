/**
 * Welcome guide analytics
 *
 * The guide is onboarding, so what matters is whether the people who see it are
 * the people it was aimed at, and how far they get before leaving. Every event
 * carries `origin`, because "opened by itself for a newcomer" and "reopened
 * deliberately from the Options menu" are different questions wearing the same
 * modal.
 */

import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useCallback, useEffect } from '@wordpress/element';
import { GUIDE_VERSION } from './pages';

/** Fired once each time the guide opens. */
export const VIEW_EVENT = 'jetpack_forms_welcome_guide_view';

/** Fired for each slide the user actually lands on, including the first. */
export const SLIDE_VIEW_EVENT = 'jetpack_forms_welcome_guide_slide_view';

/** Fired when the guide closes, whichever way it was closed. */
export const DISMISS_EVENT = 'jetpack_forms_welcome_guide_dismiss';

/** Why the guide is open. */
export type GuideOrigin = 'auto' | 'menu' | 'forced';

interface TracksProps {
	[ key: string ]: string | number | boolean;
}

interface Tracks {
	recordEvent: ( event: string, props?: TracksProps ) => void;
}

/**
 * Records a guide event with the properties every one of them carries.
 *
 * `guide_version` is added here rather than at the call sites so that no event
 * can be added later that forgets it — a single event missing the version is
 * enough to make a report choose between dropping it and guessing.
 *
 * @return A recorder taking an event name and any extra properties.
 */
export function useGuideTracks() {
	const { tracks } = useAnalytics() as { tracks: Tracks };

	return useCallback(
		( event: string, props: TracksProps = {} ) => {
			tracks.recordEvent( event, { ...props, guide_version: GUIDE_VERSION } );
		},
		[ tracks ]
	);
}

interface SlideTrackerProps {
	/** Zero-based index of the slide being shown. */
	index: number;
	/** Reports the one-based slide now on screen. */
	report: ( slide: number ) => void;
}

/**
 * Reports the slide currently on screen.
 *
 * `Guide` keeps its page number in internal state and exposes no change
 * callback, but it renders only the current page — so a component sitting
 * inside that page reports the slide simply by being the one that is mounted.
 *
 * This deliberately keeps no memory of what it has already reported: it reports
 * the slide it is showing, every time it is mounted or the slide changes, and
 * leaves the caller to decide what counts as a repeat. That is what makes it
 * indifferent to whether `Guide` reuses this element across page changes or
 * remounts it, which is an implementation detail of `@wordpress/components`
 * rather than a promise it makes.
 *
 * @param props        - Component props
 * @param props.index  - Zero-based index of the slide being shown
 * @param props.report - Reports the one-based slide now on screen
 * @return Nothing; this renders no markup.
 */
export const SlideTracker = ( { index, report }: SlideTrackerProps ) => {
	useEffect( () => {
		// One-based, to read naturally against `slide_count` in a report.
		report( index + 1 );
	}, [ index, report ] );

	return null;
};
