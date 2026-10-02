/**
 * WordPress dependencies
 */
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_FEEDBACK_BANNER_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../constants';

export type FeedbackBannerOptions = {
	/**
	 * Whether the surface the banner belongs to is ready; nothing shows until then.
	 */
	enabled: boolean;
};

export type FeedbackBanner = {
	/**
	 * Whether the banner stands. Independent of the modal, which it waits behind.
	 */
	isVisible: boolean;

	/**
	 * Whether the modal is open.
	 */
	isFeedbackOpen: boolean;

	/**
	 * Leave feedback: into the modal, the banner still standing behind it.
	 */
	open: () => void;

	/**
	 * The answer is on its way: the banner has what it asked for.
	 */
	complete: () => void;

	/**
	 * The reader left the modal. Says nothing about whether they answered.
	 */
	close: () => void;

	/**
	 * The reader closed the banner without taking it up.
	 */
	dismiss: () => void;
};

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => string | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: string ) => Promise< void > | void;
};

// Once per page load, not per mount: the dashboard stage remounts on the way
// back from a report, before the persisted preference has necessarily landed.
let hasClosedThisLoad = false;
let hasRecordedViewThisLoad = false;

/**
 * Reset the once-per-load latches. Test-only.
 */
export function resetFeedbackBannerForTesting() {
	hasClosedThisLoad = false;
	hasRecordedViewThisLoad = false;
}

/**
 * Owns the feedback banner: it stands above the widgets until the reader
 * answers or closes it, and then never again on this site for this reader.
 *
 * Opening the modal is not enough — a reader who backs out of it without
 * answering finds the banner where they left it.
 *
 * @param {FeedbackBannerOptions} props - Banner props.
 * @return What to render, and the transitions the UI can trigger.
 */
export function useFeedbackBanner( { enabled }: FeedbackBannerOptions ): FeedbackBanner {
	const trackEvent = useTrackEvent();

	const closedAt = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				DASHBOARD_PREFERENCES_SCOPE,
				DASHBOARD_FEEDBACK_BANNER_KEY
			),
		[]
	);
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const [ isClosed, setIsClosed ] = useState( () => hasClosedThisLoad );
	const [ isFeedbackOpen, setIsFeedbackOpen ] = useState( false );

	const isVisible = enabled && ! isClosed && ! closedAt;

	// Every load it is on screen, so the take-up rate has a denominator.
	useEffect( () => {
		if ( ! isVisible || hasRecordedViewThisLoad ) {
			return;
		}

		hasRecordedViewThisLoad = true;
		trackEvent( 'jetpack_premium_analytics_feedback_banner_view' );
	}, [ isVisible, trackEvent ] );

	const closeForGood = useCallback( () => {
		hasClosedThisLoad = true;
		setIsClosed( true );
		void set(
			DASHBOARD_PREFERENCES_SCOPE,
			DASHBOARD_FEEDBACK_BANNER_KEY,
			new Date().toISOString()
		);
	}, [ set ] );

	const open = useCallback( () => {
		setIsFeedbackOpen( true );
		trackEvent( 'jetpack_premium_analytics_feedback_open', { source: 'banner' } );
	}, [ trackEvent ] );

	const close = useCallback( () => setIsFeedbackOpen( false ), [] );

	const dismiss = useCallback( () => {
		closeForGood();
		trackEvent( 'jetpack_premium_analytics_feedback_banner_dismiss' );
	}, [ closeForGood, trackEvent ] );

	// The submission already reaches Tracks from the modal, carrying its source.
	return { isVisible, isFeedbackOpen, open, complete: closeForGood, close, dismiss };
}
