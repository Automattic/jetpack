import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { ReactElement } from 'react';

/**
 * Build the WPCOM checkout URL for the VideoPress upgrade CTA. The slug
 * is read from `JPVIDEOPRESS_INITIAL_STATE.jetpackStatus.calypsoSlug`,
 * set on every initial-state render (`class-initial-state.php`). Falls
 * back to bare `/checkout/videopress` when the slug isn't available so
 * the link still works (WPCOM resolves the active site server-side).
 *
 * @return Absolute checkout URL.
 */
function buildUpgradeUrl(): string {
	const base = 'https://wordpress.com/checkout';
	const slug =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.jetpackStatus?.calypsoSlug
			: '';
	return slug ? `${ base }/${ slug }/videopress` : `${ base }/videopress`;
}

/**
 * Permanent (non-dismissible) free-plan Notice rendered at the top of
 * the Overview tab. The `@wordpress/ui` Notice compound API expresses
 * non-dismissibility by omitting `<Notice.CloseIcon>` rather than via a
 * boolean prop. Uses `ActionLink` (not `ActionButton`) because the CTA
 * navigates to WPCOM checkout.
 *
 * @return The Notice element.
 */
export default function FreeTierNotice(): ReactElement {
	return (
		<Notice.Root intent="info">
			<Notice.Description>
				{ __(
					'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.',
					'jetpack-videopress-pkg'
				) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href={ buildUpgradeUrl() }>
					{ __( 'Upgrade', 'jetpack-videopress-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
