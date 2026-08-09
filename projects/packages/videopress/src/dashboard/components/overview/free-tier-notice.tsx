import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useVideoPressUpgrade } from '../../hooks/use-videopress-upgrade';
import type { ReactElement } from 'react';

type Props = {
	hasUsedVideo?: boolean;
};

// Keep these as separate module-scope `__()` calls so production minification
// cannot fold a render-time ternary into a non-literal i18n call.
const FREE_PLAN_TITLE = __( 'The free plan includes one video upload.', 'jetpack-videopress-pkg' );
const USED_VIDEO_TITLE = __( 'You have used your free video upload', 'jetpack-videopress-pkg' );
const UPGRADE_DESCRIPTION = __(
	'Upgrade for more storage and unlimited uploads.',
	'jetpack-videopress-pkg'
);

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
 * @param props              - Component props.
 * @param props.hasUsedVideo - Whether the free upload has already been used.
 * @return The Notice element.
 */
export default function FreeTierNotice( { hasUsedVideo = false }: Props ): ReactElement {
	const runUpgrade = useVideoPressUpgrade();
	const title = hasUsedVideo ? USED_VIDEO_TITLE : FREE_PLAN_TITLE;

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
			<Notice.Title>{ title }</Notice.Title>
			<Notice.Description>{ UPGRADE_DESCRIPTION }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href="#" onClick={ handleUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
