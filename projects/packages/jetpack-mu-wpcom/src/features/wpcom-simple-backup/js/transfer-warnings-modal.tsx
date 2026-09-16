import { Button, ExternalLink, Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import type { DomainNames, TransferWarning } from './types.ts';

/**
 * Split a domain so the subdomain can truncate while the rest stays readable.
 *
 * @param domainName - The full domain.
 * @return The first label, and the remainder including the leading dot.
 */
function splitDomainName( domainName: string ) {
	const parts = domainName.split( '.' );
	const first = parts.shift();
	const rest = '.' + parts.join( '.' );
	return { first, rest };
}

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
			badgeLabel: __( 'current', 'jetpack-mu-wpcom' ),
			intent: 'none' as const,
		},
		{
			label: splitDomainName( names.new ),
			badgeLabel: __( 'new', 'jetpack-mu-wpcom' ),
			intent: 'stable' as const,
		},
	];

	return (
		<Stack direction="column" gap="sm">
			{ items.map( item => (
				<Stack
					key={ item.badgeLabel }
					className="wpcom-simple-backup__domain"
					direction="row"
					align="center"
					justify="space-between"
					gap="sm"
				>
					<Stack direction="row" align="center" className="wpcom-simple-backup__address">
						<Text className="wpcom-simple-backup__domain-name">{ item.label.first }</Text>
						<Text>{ item.label.rest }</Text>
					</Stack>
					<Badge intent={ item.intent }>{ item.badgeLabel }</Badge>
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
		<Stack direction="column" gap="sm">
			<Text>
				{ warning.domain_names
					? createInterpolateElement(
							__(
								'<strong>Your site’s address will change</strong> to the one below. Links to your old address will redirect automatically.',
								'jetpack-mu-wpcom'
							),
							{ strong: <strong /> }
					  )
					: warning.description }
				{ warning.support_url && (
					<>
						{ ' ' }
						<ExternalLink href={ warning.support_url }>
							{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
						</ExternalLink>
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
 * The transfer runs in Calypso's `transferring-hosted-site` flow, which owns
 * initiation, progress and the return trip to wp-admin.
 *
 * @param props             - Component props.
 * @param props.warnings    - Non-blocking warnings to surface before proceeding.
 * @param props.activateUrl - Where to send the reader to start the transfer.
 * @param props.onClose     - Dismiss handler.
 * @return The rendered modal.
 */
export function TransferWarningsModal( {
	warnings,
	activateUrl,
	onClose,
}: {
	warnings: TransferWarning[];
	activateUrl: string;
	onClose: () => void;
} ) {
	return (
		<Modal
			className="wpcom-simple-backup__modal"
			title={ __( 'One more step', 'jetpack-mu-wpcom' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<Stack direction="column" gap="lg">
				<Stack direction="column" gap="md">
					<Text>
						{ __(
							'To turn Jetpack VaultPress Backup on, we’ll need to move your site over to WordPress.com’s advanced managed cloud hosting.',
							'jetpack-mu-wpcom'
						) }
					</Text>
					{ warnings.map( warning => (
						<Warning key={ warning.id } warning={ warning } />
					) ) }
				</Stack>
				<Stack direction="row" gap="sm" justify="flex-end">
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button variant="primary" href={ activateUrl }>
						{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}
