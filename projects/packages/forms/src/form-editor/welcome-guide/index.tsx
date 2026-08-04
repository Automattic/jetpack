/**
 * Form Editor Welcome Guide
 *
 * Replaces the generic block editor welcome modal with a guide that walks
 * through the parts of the form editor. Shows once per user, and can be
 * reopened from the editor's Options menu.
 */

import { Guide } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginMoreMenuItem } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getWelcomeGuidePages } from './pages';
import { isWelcomeGuideForced, shouldShowWelcomeGuide } from './should-show';
import './style.scss';

export const JETPACK_FORM_WELCOME_GUIDE = 'jetpack-form-welcome-guide';

/** Preference scope owned by Jetpack Forms, kept separate from core's. */
export const PREFERENCE_SCOPE = 'jetpack/forms';

/** Preference name holding whether the guide is still pending. */
export const PREFERENCE_NAME = 'welcomeGuide';

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

	const { set } = useDispatch( PREFERENCES_STORE ) as PreferencesActions;

	// Read once on mount: the query argument doesn't change within a page load,
	// and re-reading it would reopen the guide after the user closes it.
	const [ isForced ] = useState( () => isWelcomeGuideForced( window.location.search ) );

	// Tracks closing within this page load. Needed on top of the preference so
	// that a forced guide can still be dismissed.
	const [ isClosed, setIsClosed ] = useState( false );

	const handleFinish = useCallback( () => {
		setIsClosed( true );
		set( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	}, [ set ] );

	const handleReopen = useCallback( () => {
		setIsClosed( false );
		set( PREFERENCE_SCOPE, PREFERENCE_NAME, true );
	}, [ set ] );

	const isOpen = ! isClosed && shouldShowWelcomeGuide( { preference, isForced } );

	return (
		<>
			<PluginMoreMenuItem onClick={ handleReopen }>
				{ __( 'Form guide', 'jetpack-forms' ) }
			</PluginMoreMenuItem>
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
