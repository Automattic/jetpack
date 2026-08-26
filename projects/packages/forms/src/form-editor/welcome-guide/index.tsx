/**
 * Form Editor Welcome Guide
 *
 * Replaces the generic block editor welcome modal with a guide that walks
 * through the parts of the form editor. Shows once per user, and takes over
 * the editor's own "Welcome Guide" menu item so that reopens it too.
 *
 * Always loaded on the form editor, including once the guide has been
 * dismissed: this is what claims that menu item, and it has to be present in
 * every state for the claim to hold. The artwork is the only heavy part, and
 * it is fetched when the guide opens rather than when this loads.
 */

import { Guide } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';
import { getWelcomeGuidePages, WELCOME_GUIDE_IMAGES } from './pages';
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

const EDITOR_STORE = 'core/editor';

interface EditorSelectors {
	getCurrentPostType: () => string | undefined;
}

export const FormWelcomeGuide = () => {
	const preference = useSelect(
		select => select( preferencesStore ).get( PREFERENCE_SCOPE, PREFERENCE_NAME ),
		[]
	);

	// Core's own welcome modal preference. Its "Welcome Guide" item in the
	// Options menu is a toggle on this value rather than a button, so flipping
	// to true is the only signal that the user asked for a guide.
	const coreWelcomeGuide = useSelect(
		select => select( preferencesStore ).get( CORE_PREFERENCE_SCOPE, PREFERENCE_NAME ),
		[]
	);

	/*
	 * PHP only enqueues this bundle on a form editor page load, but the
	 * component then stays mounted for the rest of the session — including
	 * after in-editor navigation takes the user back out to a post or page.
	 * The preference it watches is global to the editor, so without a post
	 * type check the guide would follow them out and open over whatever they
	 * navigated to.
	 */
	const isFormEditor = useSelect(
		select =>
			( select( EDITOR_STORE ) as EditorSelectors | undefined )?.getCurrentPostType() ===
			FORM_POST_TYPE,
		[]
	);

	const { set } = useDispatch( preferencesStore );

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

		/*
		 * Only persist the dismissal the first time; re-writing false on every
		 * reopen would queue a pointless preference save. A forced guide never
		 * persists: the query argument exists to re-test the first run, so
		 * closing one must not burn the real one.
		 */
		if ( ! isForced && shouldPersistDismissal( preference ) ) {
			set( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
		}
	}, [ isForced, preference, set ] );

	const handleReopen = useCallback( () => {
		setIsClosed( false );
		setIsReopened( true );
	}, [] );

	const isOpen =
		isFormEditor &&
		isWelcomeGuideOpen( { preference, isForced, isEligible, isClosed, isReopened } );

	/*
	 * `Guide` mounts only the slide you are looking at, so each illustration
	 * otherwise starts downloading at the moment you reach it and lands a beat
	 * after the slide. Warming them all once the guide opens means every slide
	 * after the first is already in the browser cache by the time it renders.
	 * Gated on `isOpen` so an editor session that never shows the guide never
	 * fetches the artwork at all.
	 */
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		WELCOME_GUIDE_IMAGES.forEach( src => {
			// Assigning `src` is enough to start the request and populate the
			// HTTP cache; the element itself is never added to the document.
			new window.Image().src = src;
		} );
	}, [ isOpen ] );

	/*
	 * Take over the editor's "Welcome Guide" menu item. Selecting it sets
	 * core's preference to true, which would otherwise bring back the generic
	 * modal this guide replaces — so open this one instead and put the
	 * preference back. Writing false is deliberate and persists: it is the same
	 * state the user would have reached by dismissing core's modal themselves.
	 *
	 * Only a transition into true counts. The value being true on its own says
	 * nothing about whether the user asked for anything: core's own default is
	 * true until the editor bundle's subscription suppresses it, and a user who
	 * deliberately re-enabled core's guide has true persisted, which beats that
	 * suppression. Reacting to the value rather than the change would persist
	 * false on mount for both of them, switching core's welcome modal off in
	 * the post and page editors for someone who never saw it there.
	 */
	const previousCoreWelcomeGuide = useRef( coreWelcomeGuide );

	useEffect( () => {
		const wasEnabled = previousCoreWelcomeGuide.current;
		previousCoreWelcomeGuide.current = coreWelcomeGuide;

		if ( ! isFormEditor || coreWelcomeGuide !== true || wasEnabled === true ) {
			return;
		}

		handleReopen();
		set( CORE_PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	}, [ coreWelcomeGuide, handleReopen, isFormEditor, set ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Guide
			className="jetpack-forms-welcome-guide"
			contentLabel={ __( 'Welcome to the form editor', 'jetpack-forms' ) }
			finishButtonText={ __( 'Start building', 'jetpack-forms' ) }
			onFinish={ handleFinish }
			pages={ getWelcomeGuidePages() }
		/>
	);
};
