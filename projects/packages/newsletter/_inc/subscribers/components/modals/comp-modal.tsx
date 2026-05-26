import { CheckboxControl, SelectControl } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, Stack, Text } from '@wordpress/ui';
import { useCompMutation } from '../../data/use-comp-mutation';
import { useMembershipsProducts } from '../../data/use-memberships-products';
import { getSubscriberLabel } from '../../lib/subscriber-helpers';
import { recordTracksEvent } from '../../lib/tracks';
import type { Subscriber, SubscriptionPlan } from '../../data/types';

type Props = {
	subscriber: Subscriber | null;
	onClose: () => void;
};

/**
 * Format a plan label for the picker — `Plan name (currency price)`. Mirrors how Calypso renders
 * its `<ProductsSelector />` rows.
 *
 * @param product          - Membership product entry returned by the wpcom proxy.
 * @param product.title    - Plan name.
 * @param product.price    - Plan price (numeric).
 * @param product.currency - ISO currency code.
 * @return Display string.
 */
function formatPlanLabel( product: { title: string; price?: number; currency?: string } ): string {
	if ( ! product.price || ! product.currency ) {
		return product.title;
	}
	return sprintf(
		// translators: %1$s: plan title. %2$s: currency code. %3$s: numeric price.
		__( '%1$s (%2$s %3$s)', 'jetpack-newsletter' ),
		product.title,
		product.currency,
		String( product.price )
	);
}

/**
 * Modal: comp a subscriber on a paid plan. Pops a `SelectControl` with the site's membership
 * products (minus any plans the subscriber is already comped on) plus a "Doesn't expire"
 * checkbox. Confirm is disabled until a plan is picked. Mirrors Calypso's `<CompModal>`.
 *
 * @param props            - Component props.
 * @param props.subscriber - Subscriber to comp (null hides the modal).
 * @param props.onClose    - Close handler.
 * @return Dialog or null when no subscriber is queued.
 */
export default function CompModal( { subscriber, onClose }: Props ): JSX.Element | null {
	const isOpen = !! subscriber;
	const productsQuery = useMembershipsProducts( isOpen );
	const mutation = useCompMutation();

	const [ planId, setPlanId ] = useState< string >( '' );
	const [ noExpiration, setNoExpiration ] = useState( false );

	useEffect( () => {
		if ( ! isOpen ) {
			setPlanId( '' );
			setNoExpiration( false );
			return;
		}
		recordTracksEvent( 'jetpack_subscribers_comp_modal_open' );
	}, [ isOpen ] );

	const compedPlanIds = useMemo( () => {
		if ( ! subscriber ) {
			return new Set< number >();
		}
		const ids = new Set< number >();
		( subscriber.plans ?? [] ).forEach( ( plan: SubscriptionPlan ) => {
			if ( plan.is_comp && plan.subscription_id ) {
				ids.add( plan.subscription_id );
			}
		} );
		return ids;
	}, [ subscriber ] );

	const products = useMemo( () => productsQuery.data ?? [], [ productsQuery.data ] );
	const availableProducts = useMemo(
		() => products.filter( product => ! compedPlanIds.has( product.ID ) ),
		[ products, compedPlanIds ]
	);

	const options = useMemo(
		() => [
			{
				value: '',
				label: __( 'Select a plan…', 'jetpack-newsletter' ),
			},
			...availableProducts.map( product => ( {
				value: String( product.ID ),
				label: formatPlanLabel( product ),
			} ) ),
		],
		[ availableProducts ]
	);

	const selectedProduct = useMemo(
		() => availableProducts.find( product => String( product.ID ) === planId ),
		[ availableProducts, planId ]
	);

	const handleSubmit = useCallback( () => {
		const numericPlanId = Number( planId );
		const userId = subscriber?.user_id ?? 0;
		if ( ! userId || ! Number.isFinite( numericPlanId ) || numericPlanId <= 0 ) {
			return;
		}
		recordTracksEvent( 'jetpack_subscribers_comp_modal_confirm', {
			plan_id: numericPlanId,
			user_id: userId,
			is_email_subscriber: !! subscriber?.email_subscription_id,
		} );
		mutation.mutate(
			{
				user_id: userId,
				plan_id: numericPlanId,
				no_expiration: noExpiration,
				planTitle: selectedProduct?.title,
				subscriberName: getSubscriberLabel( subscriber as Subscriber ),
			},
			{ onSuccess: onClose }
		);
	}, [ mutation, onClose, planId, noExpiration, subscriber, selectedProduct ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	if ( ! subscriber ) {
		return null;
	}

	const allComped =
		! productsQuery.isLoading && products.length > 0 && availableProducts.length === 0;

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>
						{ sprintf(
							// translators: %s: subscriber display name or email.
							__( 'Comp %s', 'jetpack-newsletter' ),
							getSubscriberLabel( subscriber )
						) }
					</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Stack direction="column" gap="md">
					<Text variant="body-md">
						{ __(
							'Pick a paid plan and we’ll add a complimentary subscription for this reader.',
							'jetpack-newsletter'
						) }
					</Text>
					{ productsQuery.isError ? (
						<Notice.Root intent="error">
							<Notice.Description>
								{ productsQuery.error?.message ||
									__( 'Could not load your paid plans.', 'jetpack-newsletter' ) }
							</Notice.Description>
						</Notice.Root>
					) : null }
					{ ! productsQuery.isLoading && products.length === 0 && ! productsQuery.isError ? (
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									'You don’t have any paid newsletter plans configured on this site yet.',
									'jetpack-newsletter'
								) }
							</Notice.Description>
						</Notice.Root>
					) : null }
					{ allComped ? (
						<Notice.Root intent="info">
							<Notice.Description>
								{ __(
									'This subscriber already has a comp on every available plan.',
									'jetpack-newsletter'
								) }
							</Notice.Description>
						</Notice.Root>
					) : null }
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Plan', 'jetpack-newsletter' ) }
						value={ planId }
						onChange={ setPlanId }
						options={ options }
						disabled={ productsQuery.isLoading || mutation.isPending || allComped }
					/>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Doesn’t expire', 'jetpack-newsletter' ) }
						checked={ noExpiration }
						onChange={ setNoExpiration }
						disabled={ mutation.isPending }
					/>
				</Stack>
				<Dialog.Footer>
					<Dialog.Action
						render={ <Button variant="outline" tone="neutral" /> }
						onClick={ onClose }
						disabled={ mutation.isPending }
					>
						{ __( 'Cancel', 'jetpack-newsletter' ) }
					</Dialog.Action>
					<Button
						onClick={ handleSubmit }
						loading={ mutation.isPending }
						disabled={ mutation.isPending || ! planId }
					>
						{ __( 'Add comp', 'jetpack-newsletter' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
