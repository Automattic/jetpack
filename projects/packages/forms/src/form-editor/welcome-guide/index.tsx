/**
 * Form Editor Welcome Guide
 *
 * Replaces the generic block editor welcome modal with a guide that walks
 * through the parts of the form editor. Shows once per user, and takes over
 * the editor's own "Welcome Guide" menu item so that reopens it too.
 */

import { Guide } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getWelcomeGuidePages } from './pages';
import {
	isWelcomeGuideEligible,
	isWelcomeGuideForced,
	isWelcomeGuideOpen,
	shouldPersistDismissal,
} from './should-show';
import './style.scss';

export const JETPACK_FORM_WELCOME_GUIDE = 'jetpack-form-welcome-guide';

/** Preference scope owned by Jetpack Forms, kept separate from core's. */
export const PREFERENCE_SCOPE = 'jetpack/forms';

/** Preference name holding whether the guide is still pending. */
export const PREFERENCE_NAME = 'welcomeGuide';

/** Core's own welcome modal preference, which the Options menu item toggles. */
const CORE_PREFERENCE_SCOPE = 'core/edit-post';

const PREFERENCES_STORE = 'core/preferences';

interface PreferencesSelectors {
	get: ( scope: string, name: string ) => boolean | undefined;
}

interface PreferencesActions {
	set: ( scope: string, name: string, value: boolean ) => void;
}

export const FormWelcomeGuide = () => {
	const preference = useSelect(
		select =>
			( select( PREFERENCES_STORE ) as PreferencesSelectors ).get(
				PREFERENCE_SCOPE,
				PREFERENCE_NAME
			),
		[]
	);

	// Core's own welcome modal preference. Its "Welcome Guide" item in the
	// Options menu is a toggle on this value rather than a button, so flipping
	// to true is the only signal that the user asked for a guide.
	const coreWelcomeGuide = useSelect(
		select =>
			( select( PREFERENCES_STORE ) as PreferencesSelectors ).get(
				CORE_PREFERENCE_SCOPE,
				PREFERENCE_NAME
			),
		[]
	);

	const { set } = useDispatch( PREFERENCES_STORE ) as PreferencesActions;

	// Read once on mount: the query argument doesn't change within a page load,
	// and re-reading it would reopen the guide after the user closes it.
	const [ isForced ] = useState( () => isWelcomeGuideForced( window.location.search ) );

	// Also fixed for the page load: PHP decides this per request.
	const [ isEligible ] = useState( isWelcomeGuideEligible );

	// Tracks closing within this page load. Needed on top of the preference so
	// that a forced guide can still be dismissed.
	const [ isClosed, setIsClosed ] = useState( false );

	// Reopening from the Options menu is deliberately session-only — it does not
	// write the preference back to true, which would make the guide auto-open on
	// every later load and undo the user's dismissal.
	const [ isReopened, setIsReopened ] = useState( false );

	const handleFinish = useCallback( () => {
		setIsReopened( false );
		setIsClosed( true );

		// Only persist the dismissal the first time; re-writing false on every
		// reopen would queue a pointless preference save.
		if ( shouldPersistDismissal( preference ) ) {
			set( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
		}
	}, [ preference, set ] );

	const handleReopen = useCallback( () => {
		setIsClosed( false );
		setIsReopened( true );
	}, [] );

	const isOpen = isWelcomeGuideOpen( { preference, isForced, isEligible, isClosed, isReopened } );

	// `Guide` mounts only the slide you are looking at, so each illustration
	// otherwise starts downloading at the moment you reach it and lands a beat
	// after the slide. Warming them all once the guide opens means every slide
	// after the first is already in the browser cache by the time it renders.
	// Gated on `isOpen` so an editor session that never shows the guide never
	// fetches the artwork at all.
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		getWelcomeGuidePages().forEach( ( { imageSrc } ) => {
			// Assigning `src` is enough to start the request and populate the
			// HTTP cache; the element itself is never added to the document.
			new window.Image().src = imageSrc;
		} );
	}, [ isOpen ] );

	// Take over the editor's "Welcome Guide" menu item. Selecting it sets core's
	// preference to true, which would otherwise bring back the generic modal
	// this guide replaces — so open this one instead and put the preference
	// back. Writing false is deliberate and persists: it is the same state the
	// user would have reached by dismissing core's modal themselves.
	useEffect( () => {
		if ( coreWelcomeGuide !== true ) {
			return;
		}

		handleReopen();
		set( CORE_PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	}, [ coreWelcomeGuide, handleReopen, set ] );

	return (
		<>
			{ isOpen && (
				<Guide
					className="jetpack-forms-welcome-guide"
					contentLabel={ __( 'Welcome to the form editor', 'jetpack-forms' ) }
					finishButtonText={ __( 'Start building', 'jetpack-forms' ) }
					onFinish={ handleFinish }
					pages={ getWelcomeGuidePages() }
				/>
			) }
		</>
	);
};
