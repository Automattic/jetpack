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

// Short form of the same fact, for places a full sentence does not fit: the
// disabled-upload tooltips and the rejected-drop toast. The persistent notice
// always uses the long copy above.
export const FREE_TIER_AT_LIMIT_MESSAGE = __(
	'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
	'jetpack-videopress-pkg'
);

/**
 * Permanent (non-dismissible) free-plan upgrade Notice, rendered wherever a
 * free-tier user needs a visible upgrade path (VIDP-311). Every surface says
 * the same sentence: the notice used to switch to a shorter at-limit line on
 * some tabs, which meant the same banner read differently depending on where
 * you happened to be standing. The `@wordpress/ui` Notice compound API expresses
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

	/*
	 * `Notice.Root` speaks its children on mount unless `spokenMessage` says
	 * otherwise. This notice renders on all five screens, so the default
	 * re-announced a permanent plan state on every navigation. An empty string
	 * short-circuits the `speak()` call entirely; the notice is still read
	 * normally when the user reaches it.
	 */
	return (
		<Notice.Root intent="info" spokenMessage="">
			<Notice.Description>{ message }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href="#" onClick={ handleUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
