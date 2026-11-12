import { __, sprintf } from '@wordpress/i18n';
import { AlertDialog, Badge, Button, ButtonLink, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import {
	useDisconnectStripe,
	useMembershipsEarnings,
	useStripeStatus,
} from '../../data/memberships';
import { trackPaymentsEvent } from '../../data/tracking';
import { CommissionFees } from '../overview/earnings-card';

/**
 * The site's Stripe connection, with the commission WordPress.com takes.
 *
 * @return The card.
 */
export default function StripeCard() {
	const { data: status, isError, error } = useStripeStatus();
	const { data: earnings } = useMembershipsEarnings();
	const disconnect = useDisconnectStripe();
	const [ confirming, setConfirming ] = useState( false );

	const onConnectClick = useCallback( () => trackPaymentsEvent( 'stripe_connect_click' ), [] );
	const onConfirmDisconnect = useCallback( async () => {
		trackPaymentsEvent( 'stripe_disconnect' );
		try {
			await disconnect.mutateAsync();
		} catch ( disconnectError ) {
			return {
				close: false,
				error:
					( disconnectError as Error ).message ||
					__( 'Stripe could not be disconnected. Please try again.', 'jetpack-monetize' ),
			};
		}
	}, [ disconnect ] );

	let content;
	if ( isError ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error.message ||
						__(
							'Your Stripe connection could not be loaded. Please try again.',
							'jetpack-monetize'
						) }
				</Notice.Description>
			</Notice.Root>
		);
	} else if ( ! status ) {
		content = <Text>{ __( 'Loading…', 'jetpack-monetize' ) }</Text>;
	} else if ( status.isConnected ) {
		content = (
			<Stack direction="row" gap="md" align="center" justify="space-between" wrap="wrap">
				<Text>
					{ status.accountDescription
						? sprintf(
								/* translators: %s: the Stripe account's name or email address. */
								__( 'Connected to %s.', 'jetpack-monetize' ),
								status.accountDescription
							)
						: __( 'Connected to Stripe.', 'jetpack-monetize' ) }
				</Text>
				<AlertDialog.Root
					open={ confirming }
					onOpenChange={ setConfirming }
					onConfirm={ onConfirmDisconnect }
				>
					<AlertDialog.Trigger render={ <Button variant="outline" tone="neutral" /> }>
						{ __( 'Disconnect', 'jetpack-monetize' ) }
					</AlertDialog.Trigger>
					<AlertDialog.Popup
						intent="irreversible"
						title={ __( 'Disconnect Stripe?', 'jetpack-monetize' ) }
						description={ __(
							'Once you disconnect payments from Stripe, new subscribers won’t be able to sign up and existing subscriptions will stop working.',
							'jetpack-monetize'
						) }
						confirmButtonText={ __( 'Disconnect', 'jetpack-monetize' ) }
					/>
				</AlertDialog.Root>
			</Stack>
		);
	} else {
		content = (
			<Stack direction="column" gap="md" align="start">
				<Text>
					{ __( 'Connect a Stripe account to start collecting payments.', 'jetpack-monetize' ) }
				</Text>
				{ status.accountDescription && (
					<Text variant="body-sm">
						{ sprintf(
							/* translators: %s: the Stripe account's name or email address. */
							__( 'Previously connected to %s.', 'jetpack-monetize' ),
							status.accountDescription
						) }
					</Text>
				) }
				{ status.connectUrl && (
					<ButtonLink variant="solid" href={ status.connectUrl } onClick={ onConnectClick }>
						{ __( 'Connect Stripe', 'jetpack-monetize' ) }
					</ButtonLink>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" gap="sm" align="center">
					<Card.Title render={ <h2 /> }>{ __( 'Stripe', 'jetpack-monetize' ) }</Card.Title>
					{ status?.isSandbox && (
						<Badge intent="medium">{ __( 'Sandbox', 'jetpack-monetize' ) }</Badge>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ content }
					{ earnings && earnings.commission !== null && (
						<CommissionFees commission={ earnings.commission } />
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
