import { dateI18n, getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { useCoupons } from '../../data/coupons';
import { useStripeStatus } from '../../data/memberships';
import CouponDialog from './coupon-dialog';
import { discountLabel } from './coupons';
import DeleteCouponDialog from './delete-coupon-dialog';
import ListRow, { RowAction } from './list-row';
import { getPaymentsState } from './state';
import type { Coupon } from '../../data/coupons';
import type { StripeStatus } from '../../data/memberships';

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
	if ( coupon.emails.length ) {
		badges.push( __( 'Limited to specific emails', 'jetpack-monetize' ) );
	}
	if ( coupon.planIds.length ) {
		badges.push( __( 'Limited to specific plans', 'jetpack-monetize' ) );
	}
	return badges;
}

/**
 * The site's coupons.
 *
 * @param props        - Component props.
 * @param props.status - The site's Stripe connection.
 * @return The card.
 */
function Coupons( { status }: { status: StripeStatus } ) {
	const { canManagePlans } = getPaymentsState();
	const { data: coupons, isError, error } = useCoupons();
	const [ deleting, setDeleting ] = useState< Coupon | null >( null );
	// The coupon being edited, or null while adding one.
	const [ editing, setEditing ] = useState< { coupon: Coupon | null } | null >( null );
	const closeDelete = useCallback( () => setDeleting( null ), [] );
	const closeEdit = useCallback( () => setEditing( null ), [] );
	const openAdd = useCallback( () => setEditing( { coupon: null } ), [] );
	const openEdit = useCallback( ( coupon: Coupon ) => setEditing( { coupon } ), [] );

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
						{ canManagePlans && (
							<Stack direction="row" gap="xs">
								<RowAction
									item={ coupon }
									label={ __( 'Edit', 'jetpack-monetize' ) }
									/* translators: %s: a coupon code. */
									ariaLabel={ sprintf( __( 'Edit %s', 'jetpack-monetize' ), coupon.code ) }
									onSelect={ openEdit }
								/>
								<RowAction
									item={ coupon }
									label={ __( 'Delete', 'jetpack-monetize' ) }
									/* translators: %s: a coupon code. */
									ariaLabel={ sprintf( __( 'Delete %s', 'jetpack-monetize' ), coupon.code ) }
									onSelect={ setDeleting }
								/>
							</Stack>
						) }
					</ListRow>
				) ) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" gap="md" align="center" justify="space-between">
					<Card.Title render={ <h2 /> }>{ __( 'Coupons', 'jetpack-monetize' ) }</Card.Title>
					{ canManagePlans && (
						<Button size="compact" onClick={ openAdd }>
							{ __( 'Add a coupon', 'jetpack-monetize' ) }
						</Button>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
			{ deleting && <DeleteCouponDialog coupon={ deleting } onClose={ closeDelete } /> }
			{ editing && (
				<CouponDialog
					coupon={ editing.coupon }
					codes={ ( coupons ?? [] ).map( coupon => coupon.code ) }
					currencies={ status }
					onClose={ closeEdit }
				/>
			) }
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
	return status?.couponsEnabled ? <Coupons status={ status } /> : null;
}
