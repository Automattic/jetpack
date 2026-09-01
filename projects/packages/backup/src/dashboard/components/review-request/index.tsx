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
 * Two whole returns, not one `__()` over a ternary: the minifier factors the
 * shared call out and leaves a non-literal msgid the extractor cannot read.
 * Both msgids are legacy's character for character, so they arrive already
 * translated — including the backups line's unconditional "real-time", which is
 * ported as-is rather than reworded at a translation cost.
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
 * `useReviewRequest` owns the whole decision, including the standalone-plugin
 * gate. The destination goes through the redirect service so the wordpress.org
 * target stays maintainable outside this repo.
 *
 * @return The rendered prompt, or nothing.
 */
export default function ReviewRequest() {
	const { reason, dismiss, isDismissing } = useReviewRequest();
	const { tracks } = useAnalytics();

	const trackReviewClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_new_review_click' );
	}, [ tracks ] );

	// Which prompt this reader has already been recorded as refusing. A failed
	// dismissal leaves the card up so they can retry, but a retry is not a second
	// decision and reporting it as one inflates the rate at the flag flip. Keyed
	// on the reason, since the two prompts are separate refusals.
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
				 * A button, not legacy's `<a role="button" href="#">`, which needed a
				 * `preventDefault` to stop it navigating. `@wordpress/ui`'s Button
				 * defaults to `focusableWhenDisabled`, so disabling marks it
				 * `aria-disabled`, keeps it focusable, and still suppresses the click.
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
