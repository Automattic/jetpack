import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Link, Stack, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useReviewRequest } from '../../hooks/use-review-request';
import './style.scss';
import type { ReviewReason } from '../../data/api/review-request';

/**
 * The question that opens the prompt.
 *
 * Two whole returns rather than one string chosen by a ternary. A `__()`
 * call whose argument is a conditional is a msgid-extraction hazard: the
 * minifier factors the shared call out and leaves `__( cond ? a : b )`,
 * which is no longer a string literal for the extractor to find.
 *
 * Both msgids are legacy's, character for character, so they arrive
 * already translated rather than waiting a GlotPress cycle.
 *
 * The backups line asserts *real-time* backups unconditionally, which may
 * be wrong for a site on a daily-backup tier. That is unverified, and it
 * is legacy's wording — so it is ported as-is rather than quietly
 * reworded here. If it is wrong it is wrong in legacy today too, and
 * fixing it is a copy change with a translation cost, not a port.
 *
 * @param reason - Why the reader is being asked.
 * @return The question to show.
 */
function reviewQuestion( reason: ReviewReason ): string {
	if ( reason === 'restore' ) {
		return __( 'Was it easy to restore your site?', 'jetpack-backup-pkg' );
	}

	return __( 'Do you enjoy the peace of mind of having real-time backups?', 'jetpack-backup-pkg' );
}

/**
 * Asks a reader the product has visibly worked for to review the plugin.
 *
 * Renders nothing unless `useReviewRequest` says there is a prompt to
 * show; that hook owns the whole decision, including the gate that keeps
 * this off a site without the standalone Backup plugin.
 *
 * The destination is the redirect service rather than a wordpress.org URL
 * written here, so the target stays maintainable outside this repo. It is
 * outbound but points at the plugin's own review page rather than
 * Calypso, so the rule about linking this dashboard into Calypso does not
 * reach it.
 *
 * @return The rendered prompt, or nothing.
 */
export default function ReviewRequest() {
	const { reason, dismiss, isDismissing } = useReviewRequest();
	const { tracks } = useAnalytics();

	const trackReviewClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_new_review_click' );
	}, [ tracks ] );

	// Which prompt this reader has already been recorded as refusing.
	//
	// The write can legitimately be attempted more than once — a failed
	// dismissal leaves the card up precisely so the reader can try again —
	// but a retry is not a second decision, and reporting it as one
	// inflates the dismissal rate at the flag flip in a way that reads as
	// behaviour and is not. The same hazard `screens/overview.tsx` guards
	// the page view against.
	//
	// A ref rather than module state, and keyed on the reason: the two
	// prompts are two separate refusals, and each deserves its own event.
	const reportedRefusalFor = useRef< ReviewReason | null >( null );

	// No in-flight check of its own: `disabled` below already stops a
	// second click reaching this handler, the latch above already stops a
	// second event, and `dismiss()` already refuses a second write. A
	// fourth guard here would be the only one no test could distinguish
	// from the others.
	const onDismiss = useCallback( () => {
		if ( reason === null ) {
			return;
		}
		if ( reportedRefusalFor.current !== reason ) {
			reportedRefusalFor.current = reason;
			tracks.recordEvent( 'jetpack_backup_dismiss_review_click' );
		}
		dismiss();
	}, [ dismiss, reason, tracks ] );

	if ( reason === null ) {
		return null;
	}

	return (
		<Card.Root className="jpb-review-request">
			<Stack direction="row" align="center" justify="space-between" gap="md">
				<Stack direction="column" gap="xs">
					<Text variant="body-sm">{ reviewQuestion( reason ) }</Text>
					<Text variant="body-sm">
						<Link
							openInNewTab
							href={ getRedirectUrl( 'jetpack-backup-new-review' ) }
							onClick={ trackReviewClick }
						>
							{ /*
							 * The `<strong>` is inside the msgid because that is
							 * how legacy ships this string, and changing the msgid
							 * would throw away its translations for a bold tag.
							 */ }
							{ createInterpolateElement(
								__(
									'<strong>Please leave a review and help us spread the word!</strong>',
									'jetpack-backup-pkg'
								),
								{ strong: <strong /> }
							) }
						</Link>
					</Text>
				</Stack>
				{ /*
				 * A button, not legacy's `<a role="button" href="#">`. It does
				 * not navigate, and the anchor spelling needed a
				 * `preventDefault` to stop it trying to.
				 *
				 * Disabled while the refusal is being written. `@wordpress/ui`'s
				 * Button defaults to `focusableWhenDisabled`, so this marks it
				 * `aria-disabled` and keeps it in the tab order rather than
				 * taking the native attribute — and it does suppress the
				 * click, so this is the visible half and the first guard at
				 * once. Without it the card just sits there after a click,
				 * which is what makes a reader click again.
				 */ }
				<Button
					variant="minimal"
					tone="neutral"
					size="small"
					disabled={ isDismissing }
					onClick={ onDismiss }
				>
					{ __( 'Maybe later', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		</Card.Root>
	);
}
