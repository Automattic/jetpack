import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Card, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { useFreeTier } from '../../data/free-tier';
import { useMembershipProducts, useStripeStatus } from '../../data/memberships';
import { getPageData } from '../../data/state';
import { trackPaymentsEvent } from '../../data/tracking';
import DeletePlanDialog from './delete-plan-dialog';
import FreeTierDialog from './free-tier-dialog';
import ListRow, { RowAction } from './list-row';
import PlanDialog from './plan-dialog';
import { groupPlans, hasMonthlyTier, isTier, planPriceLabel } from './plans';
import { getPaymentsState } from './state';
import type { Plan } from './plans';

// Links elsewhere, such as Newsletter settings, open the add dialog with these.
const trackUpgradeClick = () => trackPaymentsEvent( 'upgrade_click' );

const ADD_HASHES: Record< string, boolean > = {
	'#add-new-payment-plan': false,
	'#add-tier-plan': true,
	'#add-newsletter-payment-plan': true,
};

/**
 * The site's payment plans, with the free newsletter tier when it has paid ones.
 *
 * @return The card.
 */
export default function PlansCard() {
	const { canManagePlans } = getPaymentsState();
	const { data: products, isError, error } = useMembershipProducts();
	const plans = products ? groupPlans( products ) : [];
	const hasTier = hasMonthlyTier( plans );
	const { data: freeTier } = useFreeTier( hasTier );
	const [ deleting, setDeleting ] = useState< Plan | null >( null );
	const [ editingFreeTier, setEditingFreeTier ] = useState( false );
	const { data: status } = useStripeStatus();
	// The plan being edited (null when adding), with whether a new one starts as a tier.
	const [ editing, setEditing ] = useState< { plan: Plan | null; startAsTier: boolean } | null >(
		null
	);
	// The dialog needs the Stripe account's currencies.
	const canEdit = canManagePlans && Boolean( status );

	useEffect( () => {
		if ( ! canEdit ) {
			return;
		}
		const openFromHash = () => {
			const startAsTier = ADD_HASHES[ window.location.hash ];
			if ( startAsTier !== undefined ) {
				setEditing( { plan: null, startAsTier } );
				window.history.replaceState(
					window.history.state,
					'',
					window.location.href.replace( window.location.hash, '' )
				);
			}
		};
		openFromHash();
		// The Stripe return notice links here once the page is already open.
		window.addEventListener( 'hashchange', openFromHash );
		return () => window.removeEventListener( 'hashchange', openFromHash );
	}, [ canEdit ] );

	const openAdd = useCallback( () => {
		trackPaymentsEvent( 'plan_add_click' );
		setEditing( { plan: null, startAsTier: false } );
	}, [] );
	const openEdit = useCallback( ( plan: Plan ) => setEditing( { plan, startAsTier: false } ), [] );
	const closeEdit = useCallback( () => setEditing( null ), [] );
	const closeDelete = useCallback( () => setDeleting( null ), [] );
	const openFreeTier = useCallback( () => {
		trackPaymentsEvent( 'free_tier_edit_click' );
		setEditingFreeTier( true );
	}, [] );
	const closeFreeTier = useCallback( () => setEditingFreeTier( false ), [] );

	let content;
	if ( isError ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error.message ||
						__( 'Your payment plans could not be loaded. Please try again.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	} else if ( ! products ) {
		content = (
			<Stack direction="row" justify="center" className="jp-monetize-loading">
				<Spinner />
			</Stack>
		);
	} else if ( ! plans.length && ! canManagePlans ) {
		const { upgradeUrl } = getPageData();
		content = (
			<Stack direction="column" gap="md" align="start">
				<Text>
					{ __(
						'Upgrade to set up a one-time offer or recurring payments plan.',
						'jetpack-monetize'
					) }
				</Text>
				{ upgradeUrl && (
					<ButtonLink variant="solid" href={ upgradeUrl } onClick={ trackUpgradeClick }>
						{ __( 'Upgrade', 'jetpack-monetize' ) }
					</ButtonLink>
				) }
			</Stack>
		);
	} else if ( ! plans.length ) {
		content = (
			<Text>
				{ __( 'Set up a one-time offer or recurring payments plan.', 'jetpack-monetize' ) }
			</Text>
		);
	} else {
		content = (
			<Stack direction="column" gap="lg">
				{ plans.map( plan => {
					const isReadOnly = plan.product.isReadOnly || Boolean( plan.annual?.isReadOnly );
					const badges: string[] = [];
					if ( isTier( plan ) ) {
						badges.push( __( 'Newsletter tier', 'jetpack-monetize' ) );
					}
					if ( plan.product.type === 'donation' ) {
						badges.push( __( 'Donation', 'jetpack-monetize' ) );
					}
					if ( isReadOnly ) {
						badges.push( __( 'Read-only', 'jetpack-monetize' ) );
					}

					return (
						<ListRow
							key={ plan.product.id }
							title={ plan.product.title }
							{ ...( isTier( plan ) && {
								description: plan.product.description,
								descriptionHtml: plan.product.descriptionHtml,
							} ) }
							price={ planPriceLabel( plan ) }
							badges={ badges }
						>
							{ /* Read-only plans can't be edited or deleted. */ }
							{ canManagePlans && ! isReadOnly && (
								<Stack direction="row" gap="xs">
									{ /* An annual product whose monthly one is gone can only be deleted, as in Calypso. */ }
									{ canEdit && ! plan.product.tier && (
										<RowAction
											item={ plan }
											label={ __( 'Edit', 'jetpack-monetize' ) }
											onSelect={ openEdit }
										/>
									) }
									<RowAction
										item={ plan }
										label={ __( 'Delete', 'jetpack-monetize' ) }
										onSelect={ setDeleting }
									/>
								</Stack>
							) }
						</ListRow>
					);
				} ) }
				{ hasTier && freeTier && (
					<ListRow
						title={ __( 'Free', 'jetpack-monetize' ) }
						description={ freeTier.description }
						descriptionHtml={ freeTier.descriptionHtml }
						price={ __( 'Free', 'jetpack-monetize' ) }
						badges={ [
							__( 'Newsletter tier', 'jetpack-monetize' ),
							...( freeTier.hidden ? [ __( 'Hidden from subscribers', 'jetpack-monetize' ) ] : [] ),
						] }
					>
						{ canManagePlans && (
							<Button variant="minimal" tone="neutral" size="compact" onClick={ openFreeTier }>
								{ __( 'Edit', 'jetpack-monetize' ) }
							</Button>
						) }
					</ListRow>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" gap="md" align="center" justify="space-between">
					<Card.Title render={ <h2 /> }>{ __( 'Payment plans', 'jetpack-monetize' ) }</Card.Title>
					{ canEdit && (
						<Button size="compact" onClick={ openAdd }>
							{ __( 'Add a payment plan', 'jetpack-monetize' ) }
						</Button>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
			{ deleting && <DeletePlanDialog plan={ deleting } onClose={ closeDelete } /> }
			{ editing && status && (
				<PlanDialog
					plan={ editing.plan }
					currencies={ status }
					startAsTier={ editing.startAsTier }
					onClose={ closeEdit }
				/>
			) }
			{ editingFreeTier && freeTier && (
				<FreeTierDialog freeTier={ freeTier } onClose={ closeFreeTier } />
			) }
		</Card.Root>
	);
}
