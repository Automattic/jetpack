import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, error as errorIcon } from '@wordpress/icons';
import { Card, Text } from '@wordpress/ui';

type Props = {
	error: Error;
	onRetry: () => void;
	/** A retry is already in flight. */
	isRetrying?: boolean;
};

/**
 * Fallback shown when the capabilities request fails.
 *
 * Without this branch a transient 5xx or network error leaves
 * `capabilities.data` undefined, which reads identically to "no plan" —
 * so an entitled site would be shown the upgrade upsell. Failing to read
 * the plan is not the same as having no plan, so say so and offer a
 * retry.
 *
 * @param props            - Component props.
 * @param props.onRetry    - Refetches the capabilities query.
 * @param props.isRetrying - Whether a retry is already in flight.
 * @return The rendered fallback.
 */
export default function CapabilitiesErrorScreen( { onRetry, isRetrying = false }: Props ) {
	return (
		<div className="jpb-gates__stage">
			<Card.Root className="jpb-gates__card">
				<span className="jpb-gates__badge jpb-gates__badge--warning" aria-hidden="true">
					<Icon icon={ errorIcon } />
				</span>
				<Text variant="body-xl" className="jpb-gates__title" render={ <h2 /> }>
					{ __( "We couldn't load your backup details", 'jetpack-backup-pkg' ) }
				</Text>
				{ /*
				 * Not "this is usually temporary". This screen also covers
				 * `capabilities_unreadable`, which is upstream shape drift —
				 * no amount of retrying clears it, so the copy has to leave
				 * the reader somewhere to go when the button doesn't help.
				 */ }
				<Text>
					{ __(
						"We couldn't reach WordPress.com to check this site's Backup plan. Your backups are unaffected. Try again, or contact support if this keeps happening.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<div className="jpb-gates__actions">
					{ /*
					 * Busy rather than merely clickable: the screen holds its
					 * error across a retry, so without this the DOM is
					 * byte-identical before and after the click and a retry
					 * that fails again reads as a dead button.
					 *
					 * `accessibleWhenDisabled` keeps that from costing keyboard
					 * users the page. `Button` sets the *native* `disabled`
					 * attribute unless it is passed, and a browser blurs the
					 * element it has just disabled — focus would land on
					 * `<body>`, and this card is the entire dashboard body, so
					 * there is nothing adjacent to land on.
					 */ }
					<Button
						variant="primary"
						onClick={ onRetry }
						isBusy={ isRetrying }
						disabled={ isRetrying }
						accessibleWhenDisabled
					>
						{ __( 'Try again', 'jetpack-backup-pkg' ) }
					</Button>
				</div>
			</Card.Root>
		</div>
	);
}
