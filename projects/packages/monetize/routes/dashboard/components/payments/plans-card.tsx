import { __ } from '@wordpress/i18n';
import { Badge, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { useFreeTier } from '../../data/free-tier';
import { useMembershipProducts } from '../../data/memberships';
import { trackPaymentsEvent } from '../../data/tracking';
import DeletePlanDialog from './delete-plan-dialog';
import FreeTierDialog from './free-tier-dialog';
import { groupPlans, isTier, planPriceLabel } from './plans';
import { getPaymentsState } from './state';
import type { Plan } from './plans';
import type { ReactNode } from 'react';

/**
 * One row of the list.
 *
 * @param props          - Component props.
 * @param props.title    - The plan's name.
 * @param props.details  - Its description and price.
 * @param props.badges   - Its badges.
 * @param props.children - Its actions.
 * @return The row.
 */
function PlanRow( {
	title,
	details,
	badges,
	children,
}: {
	title: string;
	details: string[];
	badges: string[];
	children?: ReactNode;
} ) {
	return (
		<Stack
			direction="row"
			gap="md"
			align="center"
			justify="space-between"
			className="jp-monetize-payments__plan"
		>
			<Stack direction="column" gap="xs">
				<Text variant="heading-sm" render={ <h3 /> }>
					{ title }
				</Text>
				{ details.filter( Boolean ).map( detail => (
					<Text key={ detail } variant="body-sm">
						{ detail }
					</Text>
				) ) }
				{ badges.length > 0 && (
					<Stack direction="row" gap="xs">
						{ badges.map( badge => (
							<Badge key={ badge } intent="informational">
								{ badge }
							</Badge>
						) ) }
					</Stack>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}

/**
 * Opens the delete dialog for one plan.
 *
 * @param props          - Component props.
 * @param props.plan     - The plan.
 * @param props.onDelete - Opens the dialog.
 * @return The button.
 */
function DeleteButton( { plan, onDelete }: { plan: Plan; onDelete: ( plan: Plan ) => void } ) {
	const onClick = useCallback( () => onDelete( plan ), [ onDelete, plan ] );
	return (
		<Button variant="minimal" tone="neutral" size="compact" onClick={ onClick }>
			{ __( 'Delete', 'jetpack-monetize' ) }
		</Button>
	);
}

/**
 * The site's payment plans, with the free newsletter tier when it has paid ones.
 *
 * @return The card.
 */
export default function PlansCard() {
	const { canManagePlans } = getPaymentsState();
	const { data: products, isError, error } = useMembershipProducts();
	const plans = products ? groupPlans( products ) : [];
	const hasTier = plans.some( isTier );
	const { data: freeTier } = useFreeTier();
	const [ deleting, setDeleting ] = useState< Plan | null >( null );
	const [ editingFreeTier, setEditingFreeTier ] = useState( false );

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
		content = <Text>{ __( 'Loading…', 'jetpack-monetize' ) }</Text>;
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
						<PlanRow
							key={ plan.product.id }
							title={ plan.product.title }
							details={ [ isTier( plan ) ? plan.product.description : '', planPriceLabel( plan ) ] }
							badges={ badges }
						>
							{ /* Calypso offers deletion even when the plan no longer allows editing. */ }
							{ ! isReadOnly && <DeleteButton plan={ plan } onDelete={ setDeleting } /> }
						</PlanRow>
					);
				} ) }
				{ hasTier && freeTier && (
					<PlanRow
						title={ __( 'Free', 'jetpack-monetize' ) }
						details={ [ freeTier.description, __( 'Free', 'jetpack-monetize' ) ] }
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
					</PlanRow>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Payment plans', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
			{ deleting && <DeletePlanDialog plan={ deleting } onClose={ closeDelete } /> }
			{ editingFreeTier && freeTier && (
				<FreeTierDialog freeTier={ freeTier } onClose={ closeFreeTier } />
			) }
		</Card.Root>
	);
}
