import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

interface SeoToolsToggle {
	/** Whether an enable request is in flight. */
	isEnabling: boolean;
	/** Activate the `seo-tools` module, then reload so the full surface registers. */
	enable: () => Promise< void >;
}

/**
 * Controller for turning the `seo-tools` module on from within the SEO page.
 *
 * Activation goes through the canonical module endpoint
 * (`POST /jetpack/v4/module/seo-tools/active`). On success we reload the page:
 * the menu and app shell already render while the module is off, but the rest
 * of the SEO surface (Settings tab, settings REST endpoints) is only registered
 * server-side when the module is active, so a reload is what brings it online.
 *
 * @return The enable controller.
 */
export default function useSeoToolsToggle(): SeoToolsToggle {
	const [ isEnabling, setIsEnabling ] = useState( false );
	const { createInfoNotice, createErrorNotice } = useDispatch( noticesStore );

	const enable = useCallback( async () => {
		setIsEnabling( true );
		try {
			await apiFetch( {
				path: '/jetpack/v4/module/seo-tools/active',
				method: 'POST',
				data: { active: true },
			} );
			createInfoNotice( __( 'SEO tools enabled.', 'jetpack-seo' ), {
				id: 'seo-tools-toggle',
				type: 'snackbar',
			} );
			// Reload so the server re-registers the now-active SEO surface.
			window.location.reload();
		} catch {
			setIsEnabling( false );
			createErrorNotice( __( 'Could not enable SEO tools. Please try again.', 'jetpack-seo' ), {
				id: 'seo-tools-toggle',
				type: 'snackbar',
			} );
		}
	}, [ createInfoNotice, createErrorNotice ] );

	return { isEnabling, enable };
}
