import analytics from '@automattic/jetpack-analytics';
// Imported via its deep export rather than the package barrel: the barrel
// (`@automattic/jetpack-connection`) re-exports the disconnect dialog, which
// imports `.jpg` assets the wp-build esbuild pipeline has no loader for, so a
// barrel import fails the build even though the hook itself needs none of it.
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { ReactElement } from 'react';

// Tracks event recorded when the upgrade CTA is clicked. Carried over verbatim
// from the legacy dashboard's `UpgradeTrigger` so both dashboards report
// against the same funnel.
const UPGRADE_CLICK_EVENT = 'jetpack_videopress_upgrade_trigger_link_click';

/**
 * Read the inlined initial state, guarding for environments (tests, the
 * legacy page) where the `var JPVIDEOPRESS_INITIAL_STATE` is absent.
 *
 * @return The initial-state payload, or undefined when it isn't present.
 */
function getInitialState() {
	return typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;
}

/**
 * Permanent (non-dismissible) free-plan Notice rendered at the top of the
 * Overview tab. The `@wordpress/ui` Notice compound API expresses
 * non-dismissibility by omitting `<Notice.CloseIcon>` rather than via a boolean
 * prop.
 *
 * The upgrade CTA reuses the shared `useProductCheckoutWorkflow` hook — the
 * same one the legacy dashboard used — so VideoPress stays in lockstep with
 * every other product's checkout behavior instead of hand-rolling a URL. The
 * connection details the hook needs are hydrated server-side by
 * `class-initial-state.php` (`Connection_Initial_State::render_script()`); the
 * product to purchase and the post-checkout redirect come from
 * `JPVIDEOPRESS_INITIAL_STATE`. The hook exposes an action (`run`, which
 * registers the site if needed then redirects) rather than a URL, so the CTA is
 * an `ActionLink` with a placeholder `href` whose default `run` cancels before
 * redirecting — keeping anchor semantics (focus, hover) while delegating
 * navigation to the workflow.
 *
 * @return The Notice element.
 */
export default function FreeTierNotice(): ReactElement {
	const state = getInitialState();
	const adminUrl = state?.siteData?.adminUrl ?? '';

	const { run } = useProductCheckoutWorkflow( {
		productSlug: state?.product?.slug ?? '',
		redirectUrl: adminUrl ? `${ adminUrl }admin.php?page=jetpack-videopress` : '',
		useBlogIdSuffix: true,
		from: 'jetpack-videopress',
	} );

	// Identify the WPCOM user for Tracks once, mirroring the legacy
	// `useAnalyticsTracks` initialization. Guarded for sites with no connected
	// WPCOM user (e.g. self-hosted, not yet connected). The event's `blog_id`
	// is supplied automatically by `window.jpTracksContext` (set alongside the
	// connection state), so it doesn't need to be passed here.
	useEffect( () => {
		const wpcomUser = getScriptData()?.user?.current_user?.wpcom;
		if ( wpcomUser?.ID && wpcomUser?.login ) {
			analytics.initialize( wpcomUser.ID, wpcomUser.login );
		}
	}, [] );

	const handleUpgradeClick = useCallback(
		( event: { preventDefault: () => void } ) => {
			analytics.tracks.recordEvent( UPGRADE_CLICK_EVENT );
			run( event );
		},
		[ run ]
	);

	return (
		<Notice.Root intent="info">
			<Notice.Description>
				{ __(
					'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.',
					'jetpack-videopress-pkg'
				) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href="#" onClick={ handleUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
