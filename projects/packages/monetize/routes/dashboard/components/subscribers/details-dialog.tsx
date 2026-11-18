import { formatCurrency } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Dialog, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { trackSubscribersEvent } from '../../data/tracking';
import { getStripeUrl, isOneTime, startDateLabel, subscriptionPriceLabel } from './subscriptions';
import type { PaidSubscription } from '../../data/subscribers';

/**
 * One labelled value in the details, left out when it's empty.
 *
 * @param props       - Component props.
 * @param props.label - The label.
 * @param props.value - The value.
 * @return The pair.
 */
function Detail( { label, value }: { label: string; value: string } ) {
	if ( ! value ) {
		return null;
	}
	return (
		<Stack direction="column" gap="xs">
			<Text variant="body-sm">{ label }</Text>
			<Text variant="heading-sm" render={ <p /> }>
				{ value }
			</Text>
		</Stack>
	);
}

/**
 * A paid subscription's details, with links to Stripe and to cancelling it.
 *
 * @param props              - Component props.
 * @param props.subscription - The subscription.
 * @param props.onClose      - Called once the dialog should go.
 * @param props.onCancel     - Opens the cancel dialog.
 * @return The dialog.
 */
export default function DetailsDialog( {
	subscription,
	onClose,
	onCancel,
}: {
	subscription: PaidSubscription;
	onClose: () => void;
	onCancel: ( subscription: PaidSubscription ) => void;
} ) {
	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);
	const onStripeClick = useCallback( () => trackSubscribersEvent( 'stripe_click' ), [] );
	const onCancelClick = useCallback( () => onCancel( subscription ), [ onCancel, subscription ] );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ subscription.name || subscription.email }</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<div className="jp-monetize-subscribers__details">
						<Detail label={ __( 'Email', 'jetpack-monetize' ) } value={ subscription.email } />
						<Detail label={ __( 'Plan', 'jetpack-monetize' ) } value={ subscription.planTitle } />
						<Detail
							label={
								isOneTime( subscription )
									? __( 'Payment', 'jetpack-monetize' )
									: __( 'Renews at', 'jetpack-monetize' )
							}
							value={ subscriptionPriceLabel( subscription ) }
						/>
						<Detail
							label={ __( 'Total paid', 'jetpack-monetize' ) }
							value={ formatCurrency( subscription.allTimeTotal, subscription.currency ) }
						/>
						<Detail
							label={ __( 'Since', 'jetpack-monetize' ) }
							value={ startDateLabel( subscription ) }
						/>
					</div>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" tone="neutral" onClick={ onCancelClick }>
						{ isOneTime( subscription )
							? __( 'Remove payment', 'jetpack-monetize' )
							: __( 'Cancel payment', 'jetpack-monetize' ) }
					</Button>
					<ButtonLink
						variant="solid"
						href={ getStripeUrl( subscription ) }
						openInNewTab
						onClick={ onStripeClick }
					>
						{ __( 'View in Stripe', 'jetpack-monetize' ) }
					</ButtonLink>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
