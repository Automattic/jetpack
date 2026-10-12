import { __ } from '@wordpress/i18n';
import { Icon, error as errorIcon } from '@wordpress/icons';
import { Button, Card, Text } from '@wordpress/ui';
import { errorCode } from '../../data/api/_helpers';
import { useFocusHandoff } from '../../hooks/use-focus-handoff';
import ErrorReference from '../error-reference';

type Props = {
	error: Error;
	onRetry: () => void;
	/** A retry is already in flight. */
	isRetrying?: boolean;
};

/**
 * `<Page>`'s region, where focus goes once a retry succeeds: this card is the whole body,
 * so nothing nearer outlives it.
 *
 * @param stage - The card's stage, about to unmount.
 * @return The region, or null outside one.
 */
const pageRegion = ( stage: HTMLElement ) => stage.closest< HTMLElement >( '[role="region"]' );

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
 * @param props.error      - The error the capabilities query failed with.
 * @param props.onRetry    - Refetches the capabilities query.
 * @param props.isRetrying - Whether a retry is already in flight.
 * @return The rendered fallback.
 */
export default function CapabilitiesErrorScreen( { error, onRetry, isRetrying = false }: Props ) {
	const stageRef = useFocusHandoff< HTMLDivElement >( pageRegion );

	return (
		<div className="jpb-gates__stage" ref={ stageRef }>
			<Card.Root className="jpb-gates__card">
				<span className="jpb-gates__badge jpb-gates__badge--warning" aria-hidden="true">
					<Icon icon={ errorIcon } />
				</span>
				<Text variant="body-xl" className="jpb-gates__title" render={ <h2 /> }>
					{ __( "We couldn't load your backup details", 'jetpack-backup-pkg' ) }
				</Text>
				{ /* Not "this is usually temporary": retrying does not clear every cause. */ }
				<Text>
					{ __(
						"We couldn't check this site's Backup plan. Your backups are unaffected. Try again, or contact support if this keeps happening.",
						'jetpack-backup-pkg'
					) }
				</Text>
				<ErrorReference code={ errorCode( error ) } id={ null } />
				<div className="jpb-gates__actions">
					{ /*
					 * `loading` keeps the button focusable: a natively disabled
					 * button would drop focus to `<body>`, and this card is the
					 * whole dashboard body.
					 */ }
					<Button variant="solid" tone="brand" onClick={ onRetry } loading={ isRetrying }>
						{ __( 'Try again', 'jetpack-backup-pkg' ) }
					</Button>
				</div>
			</Card.Root>
		</div>
	);
}
