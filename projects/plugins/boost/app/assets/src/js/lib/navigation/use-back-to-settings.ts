import { useBoostNavigation } from '$lib/navigation/navigation-context';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { MouseEvent } from 'react';

type BackToSettingsSource = 'back_button' | 'back_link' | 'breadcrumb';

/**
 * Goes back to Settings without reloading the page, recording which control was clicked.
 *
 * @param source - The control, sent as the `source` of `back_button_clicked`.
 * @return The Settings href and a click handler.
 */
export function useBackToSettings( source: BackToSettingsSource ) {
	const { returnToSettings, settingsHref } = useBoostNavigation();

	const onClick = ( e: MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
			source,
		} );
		returnToSettings();
	};

	return { href: settingsHref, onClick };
}
