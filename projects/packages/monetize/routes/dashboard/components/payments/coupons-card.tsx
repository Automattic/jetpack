import { dateI18n, getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { useCoupons } from '../../data/coupons';
import { useStripeStatus } from '../../data/memberships';
import { discountLabel } from './coupons';
import DeleteCouponDialog from './delete-coupon-dialog';
import ListRow from './list-row';
import { getPaymentsState } from './state';
import type { Coupon } from '../../data/coupons';

/**
 * Opens the delete dialog for one coupon.
 *
 * @param props          - Component props.
 * @param props.coupon   - The coupon.
 * @param props.onDelete - Opens the dialog.
 * @return The button.
 */
function DeleteButton( {
	coupon,
	onDelete,
}: {
	coupon: Coupon;
	onDelete: ( coupon: Coupon ) => void;
} ) {
	const onClick = useCallback( () => onDelete( coupon ), [ onDelete, coupon ] );
	return (
		<Button variant="minimal" tone="neutral" size="compact" onClick={ onClick }>
			{ __( 'Delete', 'jetpack-monetize' ) }
		</Button>
	);
}

/**
 * A coupon's badges, as Calypso shows them.
 *
 * @param coupon - The coupon.
 * @return The badges.
 */
function couponBadges( coupon: Coupon ): string[] {
	const badges = [ discountLabel( coupon ) ];
	if ( coupon.endDate ) {
		badges.push(
			sprintf(
				/* translators: %s: a date, e.g. December 31, 2026. */
				__( 'Expires on %s', 'jetpack-monetize' ),
				dateI18n( getSettings().formats.date, `${ coupon.endDate }T00:00:00Z`, true )
			)
		);
	}
	if ( ! coupon.canBeCombined ) {
		badges.push( __( 'Cannot be combined with other coupons', 'jetpack-monetize' ) );
	}
	if ( coupon.firstTimeOnly ) {
		badges.push( __( 'First-time order only', 'jetpack-monetize' ) );
	}
	if ( coupon.limitedToEmails ) {
		badges.push( __( 'Limited to specific emails', 'jetpack-monetize' ) );
	}
	if ( coupon.limitedToPlans ) {
		badges.push( __( 'Limited to specific plans', 'jetpack-monetize' ) );
	}
	return badges;
}

/**
 * The site's coupons.
 *
 * @return The card.
 */
function Coupons() {
	const { canManagePlans } = getPaymentsState();
	const { data: coupons, isError, error } = useCoupons();
	const [ deleting, setDeleting ] = useState< Coupon | null >( null );
	const closeDelete = useCallback( () => setDeleting( null ), [] );

	let content;
	if ( isError ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error.message ||
						__( 'Your coupons could not be loaded. Please try again.', 'jetpack-monetize' ) }
				</Notice.Description>
			</Notice.Root>
		);
	} else if ( ! coupons ) {
		content = <Text>{ __( 'Loading…', 'jetpack-monetize' ) }</Text>;
	} else if ( ! coupons.length ) {
		content = (
			<Text>
				{ __( 'Offer a discount on your plans with a coupon code.', 'jetpack-monetize' ) }
			</Text>
		);
	} else {
		content = (
			<Stack direction="column" gap="lg">
				{ coupons.map( coupon => (
					<ListRow key={ coupon.id } title={ coupon.code } badges={ couponBadges( coupon ) }>
						{ canManagePlans && <DeleteButton coupon={ coupon } onDelete={ setDeleting } /> }
					</ListRow>
				) ) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Coupons', 'jetpack-monetize' ) }</Card.Title>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
			{ deleting && <DeleteCouponDialog coupon={ deleting } onClose={ closeDelete } /> }
		</Card.Root>
	);
}

/**
 * The coupons card, when WordPress.com has coupons turned on for the site, since it refuses coupon requests otherwise.
 *
 * @return The card, or nothing.
 */
export default function CouponsCard() {
	const { data: status } = useStripeStatus();
	return status?.couponsEnabled ? <Coupons /> : null;
}
