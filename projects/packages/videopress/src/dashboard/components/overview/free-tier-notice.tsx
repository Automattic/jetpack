import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useVideoPressUpgrade } from '../../hooks/use-videopress-upgrade';
import type { ReactElement } from 'react';

/**
 * Permanent (non-dismissible) free-plan Notice rendered at the top of the
 * Overview tab. The `@wordpress/ui` Notice compound API expresses
 * non-dismissibility by omitting `<Notice.CloseIcon>` rather than via a boolean
 * prop.
 *
 * The upgrade CTA delegates to the shared `useVideoPressUpgrade` hook so this
 * notice and the Library at-limit notice drive the exact same checkout. The
 * hook starts a workflow (register-then-redirect) rather than exposing a URL,
 * so the CTA is an `ActionLink` with a placeholder `href` whose default is
 * cancelled before the workflow runs — keeping anchor semantics (focus, hover)
 * while delegating navigation to the workflow.
 *
 * @return The Notice element.
 */
export default function FreeTierNotice(): ReactElement {
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
