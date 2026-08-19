import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useVideoPressUpgrade } from '../../hooks/use-videopress-upgrade';
import type { ReactElement } from 'react';

// Hoisted to module scope as separate statements so each variant stays its
// own `__()` call with a string-literal argument — an inline ternary would be
// folded by terser into `__( cond ? 'a' : 'b', domain )`, which breaks POT
// extraction (see the VIDP-245 note in client/admin/components/admin-page).
const FREE_PLAN_MESSAGE = __(
	'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.',
	'jetpack-videopress-pkg'
);

// The at-limit copy is shared with the Library's disabled-upload tooltip and
// its at-limit drop notice, so every surface describes the cap identically.
export const FREE_TIER_AT_LIMIT_MESSAGE = __(
	'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
	'jetpack-videopress-pkg'
);

/**
 * Permanent (non-dismissible) free-plan upgrade Notice. The Overview tab
 * renders it for every free-tier user with the default free-plan copy; the
 * Library and Settings tabs render it once the free upload is used, with the
 * at-limit copy, so the disabled upload path always comes with a visible
 * upgrade path (VIDP-311). The `@wordpress/ui` Notice compound API expresses
 * non-dismissibility by omitting `<Notice.CloseIcon>` rather than via a
 * boolean prop.
 *
 * The upgrade CTA delegates to the shared `useVideoPressUpgrade` hook so
 * every rendering of this notice drives the exact same checkout. The hook
 * starts a workflow (register-then-redirect) rather than exposing a URL, so
 * the CTA is an `ActionLink` with a placeholder `href` whose default is
 * cancelled before the workflow runs — keeping anchor semantics (focus,
 * hover) while delegating navigation to the workflow.
 *
 * @param props         - Component props.
 * @param props.message - Notice body copy. Defaults to the free-plan copy.
 * @return The Notice element.
 */
export default function FreeTierNotice( {
	message = FREE_PLAN_MESSAGE,
}: {
	message?: string;
} ): ReactElement {
	const runUpgrade = useVideoPressUpgrade();

	const handleUpgradeClick = useCallback(
		( event: { preventDefault: () => void } ) => {
			// Cancel the placeholder-href default so the workflow, not the
			// anchor, performs navigation.
			event.preventDefault();
			runUpgrade();
		},
		[ runUpgrade ]
	);

	return (
		<Notice.Root intent="info">
			<Notice.Description>{ message }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href="#" onClick={ handleUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
