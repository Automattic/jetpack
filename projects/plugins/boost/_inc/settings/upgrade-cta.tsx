import { Button, Notice } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';

// Routes to the My Jetpack "Add Boost" upgrade flow — same destination
// the Overview tab's free-plan chart overlay uses. Kept as a wp-admin
// relative path so it resolves on subdirectory installs / multisite /
// custom admin URLs. The `#/add-boost-<identifier>` hash lets My
// Jetpack scroll the matching product card into view when supported.
const ADD_BOOST_URL = 'admin.php?page=my-jetpack#/add-boost';

type Props = {
	/** Identifier appended to the upgrade URL hash so My Jetpack can deep-link. */
	identifier: string;
	/** Body copy describing what the upgrade unlocks. */
	description: ReactNode;
};

/**
 * Inline upgrade callout rendered inside a settings card when the
 * card's premium sub-feature is unavailable on the current plan.
 * Replaces the legacy `<InterstitialModalCTA />` modal — the modal
 * would re-render the entire My Jetpack interstitial inside Boost,
 * which is more weight than this PR needs. Linking out keeps the
 * upgrade flow centralized in My Jetpack.
 *
 * Visually a `Notice` with `intent="info"` plus an "Upgrade now"
 * `Button` — same shape as the free-plan chart-overlay Notice on the
 * Overview tab so the upgrade affordance feels consistent across the
 * unified Boost product.
 *
 * @param props             - See `Props`.
 * @param props.identifier
 * @param props.description
 * @return The inline upgrade Notice element.
 */
export default function UpgradeCTA( { identifier, description }: Props ): JSX.Element {
	const url = `${ ADD_BOOST_URL }-${ identifier }`;
	return (
		<Notice.Root intent="info" className="jetpack-boost-settings__upgrade">
			<Notice.Description>{ description }</Notice.Description>
			<Notice.Actions>
				<Button variant="solid" size="compact" href={ url }>
					{ __( 'Upgrade now', 'jetpack-boost' ) }
				</Button>
			</Notice.Actions>
		</Notice.Root>
	);
}
