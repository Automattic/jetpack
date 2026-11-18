import { formatCurrency } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import { chartBar, payment } from '@wordpress/icons';
import { Avatar, Button, ButtonLink, Card, Dialog, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { trackSubscribersEvent } from '../../data/tracking';
import { getStripeUrl, isOneTime, startDateLabel, subscriptionPriceLabel } from './subscriptions';
import type { PaidSubscription } from '../../data/subscribers';
import type { ReactNode } from 'react';

/**
 * One headline amount, such as the total spent.
 *
 * @param props       - Component props.
 * @param props.icon  - The icon.
 * @param props.label - The label.
 * @param props.value - The amount.
 * @return The card.
 */
function Figure( { icon, label, value }: { icon: ReactNode; label: string; value: string } ) {
	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="sm">
					{ icon }
					<Text variant="body-md">{ label }</Text>
					<Text variant="heading-xl">{ value }</Text>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * A titled group of labelled values, leaving out the empty ones.
 *
 * @param props       - Component props.
 * @param props.title - The section title.
 * @param props.items - The label and value pairs.
 * @return The card.
 */
function Section( { title, items }: { title: string; items: [ string, string ][] } ) {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h3 /> }>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<dl className="jp-monetize-subscribers__details">
					{ items
						.filter( ( [ , value ] ) => value )
						.map( ( [ label, value ] ) => (
							<div key={ label } className="jp-monetize-subscribers__detail">
								<dt>{ label }</dt>
								<dd>{ value }</dd>
							</div>
						) ) }
				</dl>
			</Card.Content>
		</Card.Root>
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
	const name = subscription.name || subscription.email;

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="large">
				<Dialog.Header>
					<Stack direction="row" gap="md" align="center">
						<Avatar.Root size="lg">
							{ subscription.avatarUrl && <Avatar.Image src={ subscription.avatarUrl } alt="" /> }
							<Avatar.Initials name={ name } />
						</Avatar.Root>
						<Stack direction="column" gap="xs">
							<Dialog.Title>{ name }</Dialog.Title>
							{ subscription.name && subscription.email && (
								<Text variant="body-sm">{ subscription.email }</Text>
							) }
						</Stack>
					</Stack>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<div className="jp-monetize-subscribers__figures">
							<Figure
								icon={ <Icon icon={ payment } /> }
								label={ __( 'Last payment', 'jetpack-monetize' ) }
								value={ formatCurrency( subscription.renewalPrice, subscription.currency ) }
							/>
							<Figure
								icon={ <Icon icon={ chartBar } /> }
								label={ __( 'Total spent', 'jetpack-monetize' ) }
								value={ formatCurrency( subscription.allTimeTotal, subscription.currency ) }
							/>
						</div>
						<Section
							title={ __( 'Details', 'jetpack-monetize' ) }
							items={ [
								[ __( 'Plan', 'jetpack-monetize' ), subscription.planTitle ],
								[ __( 'Amount', 'jetpack-monetize' ), subscriptionPriceLabel( subscription ) ],
								[ __( 'Since', 'jetpack-monetize' ), startDateLabel( subscription ) ],
							] }
						/>
						<Section
							title={ __( 'Supporter information', 'jetpack-monetize' ) }
							items={ [ [ __( 'Email', 'jetpack-monetize' ), subscription.email ] ] }
						/>
					</Stack>
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
