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
import { useCallback, useEffect, useRef } from '@wordpress/element';

/** Fired once each time the guide opens. */
export const VIEW_EVENT = 'jetpack_forms_welcome_guide_view';

/** Fired for each slide the user actually lands on, including the first. */
export const SLIDE_VIEW_EVENT = 'jetpack_forms_welcome_guide_slide_view';

/** Fired when the guide closes, whichever way it was closed. */
export const DISMISS_EVENT = 'jetpack_forms_welcome_guide_dismiss';

/**
 * Fired on moving forward a slide.
 *
 * `Guide` routes its Next button and the Right arrow key through one handler
 * and exposes neither, so this is derived from the slide changing — keyboard
 * navigation counts the same as a click.
 */
export const NEXT_EVENT = 'jetpack_forms_welcome_guide_next_click';

/** Fired on moving back a slide. Derived the same way as NEXT_EVENT. */
export const PREVIOUS_EVENT = 'jetpack_forms_welcome_guide_previous_click';

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
 * @return A recorder taking an event name and any extra properties.
 */
export function useGuideTracks() {
	const { tracks } = useAnalytics() as { tracks: Tracks };

	return useCallback(
		( event: string, props: TracksProps = {} ) => {
			tracks.recordEvent( event, props );
		},
		[ tracks ]
	);
}

interface SlideTrackerProps {
	/** Zero-based index of the slide being shown. */
	index: number;
	/** Total number of slides, so a drop-off can be read without knowing the guide. */
	slideCount: number;
	/** Why the guide is open. */
	origin: GuideOrigin;
	/** Records the event. */
	record: ( event: string, props?: TracksProps ) => void;
}

/**
 * Reports the slide currently on screen.
 *
 * `Guide` keeps its page number in internal state and exposes no change
 * callback, but it renders only the current page — so a component sitting
 * inside that page reports the slide simply by being the one that is mounted.
 * The effect keys on `index` rather than on mount, because React reuses this
 * element across page changes instead of remounting it.
 *
 * @param props            - Component props
 * @param props.index      - Zero-based index of the slide being shown
 * @param props.slideCount - Total number of slides
 * @param props.origin     - Why the guide is open
 * @param props.record     - Records the event
 * @return Nothing; this renders no markup.
 */
export const SlideTracker = ( { index, slideCount, origin, record }: SlideTrackerProps ) => {
	// Survives a page change, because React updates this element rather than
	// remounting it. It resets with the guide, which is what we want: reopening
	// starts a fresh journey.
	const previousIndex = useRef< number | null >( null );

	useEffect( () => {
		const from = previousIndex.current;
		previousIndex.current = index;

		record( SLIDE_VIEW_EVENT, {
			// One-based, to read naturally against `slide_count` in a report.
			slide: index + 1,
			slide_count: slideCount,
			origin,
		} );

		// The first slide is arrived at by opening the guide, not by navigating.
		if ( from === null || from === index ) {
			return;
		}

		record( index > from ? NEXT_EVENT : PREVIOUS_EVENT, {
			from: from + 1,
			to: index + 1,
			slide_count: slideCount,
			origin,
		} );
	}, [ index, origin, record, slideCount ] );

	return null;
};
