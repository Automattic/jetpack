import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

// Pre-resolved so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const enableErrorMessage = __( 'Could not enable SEO tools. Please try again.', 'jetpack-seo' );
const disableErrorMessage = __( 'Could not disable SEO tools. Please try again.', 'jetpack-seo' );

interface SeoToolsToggle {
	/** Whether a toggle request is in flight. */
	isToggling: boolean;
	/** Activate or deactivate the `seo-tools` module, then reload. */
	setActive: ( active: boolean ) => Promise< void >;
}

/**
 * Controller for turning the `seo-tools` module on or off from within the SEO
 * page.
 *
 * Goes through the canonical module endpoint
 * (`POST /jetpack/v4/module/seo-tools/active`). On success we reload: the menu
 * and app shell render regardless of module state, but the rest of the SEO
 * surface (Settings tab, settings REST endpoints) is only registered
 * server-side when the module is active, so a reload is what brings the page
 * into (or out of) its full state. The reload is the success feedback — a
 * snackbar wouldn't survive it — so we only surface a notice on failure.
 *
 * @return The toggle controller.
 */
export default function useSeoToolsToggle(): SeoToolsToggle {
	const [ isToggling, setIsToggling ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );

	const setActive = useCallback(
		async ( active: boolean ) => {
			setIsToggling( true );
			try {
				await apiFetch( {
					path: '/jetpack/v4/module/seo-tools/active',
					method: 'POST',
					data: { active },
				} );
				// Reload so the server re-registers (or tears down) the SEO surface.
				window.location.reload();
			} catch {
				setIsToggling( false );
				createErrorNotice( active ? enableErrorMessage : disableErrorMessage, {
					id: 'seo-tools-toggle',
					type: 'snackbar',
				} );
			}
		},
		[ createErrorNotice ]
	);

	return { isToggling, setActive };
}
