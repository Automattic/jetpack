import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Dialog, Link, LinkButton, Stack, Text } from '@wordpress/ui';
import { splitDomainName } from './domain.ts';
import { canProceed, hasAnyBlockingError, needsPlanUpgrade } from './eligibility.ts';
import { ErrorContentInfo } from './error-content-info.tsx';
import { ViewTracker, recordActivationConfirm } from './tracks.ts';
import type { DomainNames, TransferError, TransferWarning } from './types.ts';

/**
 * The current and new site addresses, side by side.
 *
 * @param props       - Component props.
 * @param props.names - The addresses before and after the transfer.
 * @return The rendered address pair.
 */
function AddressPair( { names }: { names: DomainNames } ) {
	const items = [
		{
			label: splitDomainName( names.current ),
			/* translators: badge marking which of two site addresses is the existing one. */
			badgeLabel: __( 'current', 'jetpack-mu-wpcom' ),
			intent: 'none' as const,
		},
		{
			label: splitDomainName( names.new ),
			/* translators: badge marking which of two site addresses the site will move to. */
			badgeLabel: __( 'new', 'jetpack-mu-wpcom' ),
			intent: 'stable' as const,
		},
	];

	return (
		<Stack direction="column" gap="sm">
			{ items.map( item => (
				<Stack
					key={ item.intent }
					className="wpcom-backup__domain"
					direction="row"
					align="center"
					justify="space-between"
					gap="sm"
				>
					<Stack
						className="wpcom-backup__address"
						direction="row"
						align="center"
						justify="flex-start"
					>
						<Text className="wpcom-backup__domain-name">{ item.label.first }</Text>
						<Text className="wpcom-backup__domain-suffix">{ item.label.rest }</Text>
					</Stack>
					<Badge className="wpcom-backup__domain-badge" intent={ item.intent }>
						{ item.badgeLabel }
					</Badge>
				</Stack>
			) ) }
		</Stack>
	);
}

/**
 * One warning: either the address-change notice or the API's own description.
 *
 * @param props         - Component props.
 * @param props.warning - The warning to render.
 * @return The rendered warning.
 */
function Warning( { warning }: { warning: TransferWarning } ) {
	return (
		<Stack direction="column" gap="xl">
			<Text>
				{ /* Wrap in span; avoids a Google Translate DOM crash (facebook/react#11538) */ }
				{ warning.domain_names ? (
					<span>
						{ createInterpolateElement(
							__(
								'<strong>Your site’s address will change</strong> to the one below. Links to your old address will redirect automatically.',
								'jetpack-mu-wpcom'
							),
							{ strong: <strong /> }
						) }
					</span>
				) : (
					<span>{ warning.description }</span>
				) }
				{ warning.support_url && (
					<>
						{ ' ' }
						<Link href={ warning.support_url } openInNewTab>
							{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
						</Link>
						.
					</>
				) }
			</Text>
			{ warning.domain_names && <AddressPair names={ warning.domain_names } /> }
		</Stack>
	);
}

/**
 * Confirmation shown before handing off to the transfer flow.
 *
 * Ported from the dashboard's `HostingFeatureActivationModal`
 * (`client/dashboard/sites/hosting-feature-activation-modal`). The transfer runs
 * in Calypso's `transferring-hosted-site` flow, which owns initiation, progress
 * and the return trip to wp-admin, so proceeding is a link rather than a
 * request.
 *
 * @param props             - Component props.
 * @param props.isEligible  - Whether the site passed every transfer check.
 * @param props.errors      - Blocking errors to explain instead of proceeding.
 * @param props.warnings    - Non-blocking warnings to surface before proceeding.
 * @param props.activateUrl - Where to send the reader to start the transfer.
 * @param props.onClose     - Dismiss handler.
 * @return The rendered modal.
 */
export function TransferActivationModal( {
	isEligible,
	errors,
	warnings,
	activateUrl,
	onClose,
}: {
	isEligible: boolean;
	errors: TransferError[];
	warnings: TransferWarning[];
	activateUrl: string;
	onClose: () => void;
} ) {
	const isBlocked = hasAnyBlockingError( errors );
	const needsUpgrade = needsPlanUpgrade( errors );

	const actionLabel = needsUpgrade
		? __( 'Upgrade and continue', 'jetpack-mu-wpcom' )
		: __( 'Activate backups', 'jetpack-mu-wpcom' );

	return (
		<Dialog.Root open onOpenChange={ open => ! open && onClose() }>
			<Dialog.Popup className="wpcom-backup__modal" size="medium">
				<ViewTracker eventName="calypso_dashboard_hosting_feature_activation_modal_impression" />
				<Dialog.Header>
					<Dialog.Title>
						{ errors.length > 0
							? __( 'Backups cannot be activated', 'jetpack-mu-wpcom' )
							: __( 'One more step', 'jetpack-mu-wpcom' ) }
					</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="md">
						{ isEligible && ! isBlocked && (
							<Text>
								{ __(
									'To turn Jetpack VaultPress Backup on, we’ll need to move your site over to WordPress.com’s advanced managed cloud hosting.',
									'jetpack-mu-wpcom'
								) }
							</Text>
						) }
						{ errors.length > 0 && <ErrorContentInfo errors={ errors } /> }
						{ warnings.length > 0 && ! isBlocked && (
							<Stack direction="column" gap="sm">
								{ warnings.map( warning => (
									<Warning key={ warning.id } warning={ warning } />
								) ) }
							</Stack>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					{ /* An anchor cannot be disabled, so a blocked transfer gets a button instead. */ }
					{ canProceed( isEligible, errors ) ? (
						<LinkButton variant="solid" href={ activateUrl } onClick={ recordActivationConfirm }>
							{ actionLabel }
						</LinkButton>
					) : (
						<Button variant="solid" disabled>
							{ actionLabel }
						</Button>
					) }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
