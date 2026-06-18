import { CheckboxControl, SelectControl } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, Stack, Text } from '@wordpress/ui';
import { useCompMutation } from '../../data/use-comp-mutation';
import { useMembershipsProducts } from '../../data/use-memberships-products';
import { useSubscriberDetails } from '../../data/use-subscriber-details';
import { getSubscriberLabel } from '../../lib/subscriber-helpers';
import { recordTracksEvent } from '../../lib/tracks';
import type { MembershipsProduct } from '../../data/api';
import type { Subscriber, SubscriptionPlan } from '../../data/types';

type Props = {
	subscriber: Subscriber | null;
	onClose: () => void;
};

/**
 * Translate a membership billing interval (e.g. `1 year`) into a short, localized cadence word
 * shown after the price. Falls back to the raw interval for anything we don't recognize.
 *
 * @param interval - Raw interval string from the wpcom proxy (e.g. `1 month`, `1 year`).
 * @return Localized cadence (e.g. `year`), or an empty string when no interval is set.
 */
function formatInterval( interval?: string ): string {
	switch ( interval ) {
		case '1 day':
			return __( 'day', 'jetpack-newsletter' );
		case '1 week':
			return __( 'week', 'jetpack-newsletter' );
		case '1 month':
			return __( 'month', 'jetpack-newsletter' );
		case '1 year':
			return __( 'year', 'jetpack-newsletter' );
		default:
			return interval ?? '';
	}
}

/**
 * Format a plan label for the picker — `Plan name (currency price / interval)`. Mirrors how Calypso
 * renders its `<ProductsSelector />` rows. The interval disambiguates plans that share a name and
 * currency but bill on different cadences (e.g. a $1/month vs $12/year tier).
 *
 * @param product          - Membership product entry returned by the wpcom proxy.
 * @param product.title    - Plan name.
 * @param product.price    - Plan price (preformatted string, e.g. `12.00`).
 * @param product.currency - ISO currency code.
 * @param product.interval - Billing interval (e.g. `1 year`).
 * @return Display string.
 */
function formatPlanLabel( product: MembershipsProduct ): string {
	if ( ! product.price || ! product.currency ) {
		return product.title;
	}
	const cadence = formatInterval( product.interval );
	if ( ! cadence ) {
		return sprintf(
			// translators: %1$s: plan title. %2$s: currency code. %3$s: price.
			__( '%1$s (%2$s %3$s)', 'jetpack-newsletter' ),
			product.title,
			product.currency,
			product.price
		);
	}
	return sprintf(
		// translators: %1$s: plan title. %2$s: currency code. %3$s: price. %4$s: billing cadence, e.g. "year".
		__( '%1$s (%2$s %3$s / %4$s)', 'jetpack-newsletter' ),
		product.title,
		product.currency,
		product.price,
		cadence
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

	// The subscriber list payload omits plans, so pull the reader's existing comps from the
	// individual-subscriber endpoint (shared React Query cache with the detail panel) to filter
	// out plans they're already comped on.
	const detailsQuery = useSubscriberDetails( {
		subscription_id: subscriber?.email_subscription_id || subscriber?.wpcom_subscription_id,
		user_id: subscriber?.user_id,
	} );

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

	// A comp's `subscription_id` is the membership product id, so the ids collected here line up
	// with `product.id` in the picker below — letting us flag plans the reader already has.
	const compedPlanIds = useMemo( () => {
		const ids = new Set< number >();
		( detailsQuery.data?.plans ?? [] ).forEach( ( plan: SubscriptionPlan ) => {
			// The wpcom payload is loosely typed (it sends `price` as a string), so coerce the id —
			// a string would never match the numeric `product.id` in the Set's strict `has()`.
			const subscriptionId = Number( plan.subscription_id );
			if ( plan.is_comp && subscriptionId > 0 ) {
				ids.add( subscriptionId );
			}
		} );
		return ids;
	}, [ detailsQuery.data ] );

	const products = useMemo( () => productsQuery.data ?? [], [ productsQuery.data ] );

	// Keep every plan in the picker but disable the ones the reader is already comped on — that
	// surfaces "this plan exists and they already have it" rather than silently hiding it. The
	// disabled rows carry a `title` so the browser explains the why on hover (a native tooltip —
	// a styled one can't attach to a native `<option>`).
	const options = useMemo( () => {
		const compedHint = __( 'This reader already has this plan.', 'jetpack-newsletter' );
		return [
			{
				value: '',
				label: __( 'Select a plan…', 'jetpack-newsletter' ),
			},
			...products.map( product => {
				const isComped = compedPlanIds.has( Number( product.id ) );
				return {
					value: String( product.id ),
					label: formatPlanLabel( product ),
					disabled: isComped,
					title: isComped ? compedHint : undefined,
				};
			} ),
		];
	}, [ products, compedPlanIds ] );

	const selectedProduct = useMemo(
		() => products.find( product => String( product.id ) === planId ),
		[ products, planId ]
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
			// Close on settle (success or error), mirroring Calypso: the snackbar carries the
			// outcome — including the upstream reason like "User has already been comped this plan".
			{ onSettled: onClose }
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
		! productsQuery.isLoading &&
		products.length > 0 &&
		products.every( product => compedPlanIds.has( product.id ) );

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
				<Dialog.Content>
					<Stack direction="column" gap="md" className="jetpack-newsletter__comp-modal-body">
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
				</Dialog.Content>
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
