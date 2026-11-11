import { CONNECTION_FROM } from '@automattic/jetpack-connection';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { caution, error } from '@wordpress/icons';
import { Icon, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { GoldenTokenTooltip } from '../golden-token/tooltip';
import { PlanLogo, PlanSectionFooter, getPlanExpiry } from '../plans-section';
import styles from './style.module.scss';
import type { Purchase } from '../../data/types';
import type { FC } from 'react';

// Tells the plan links' Tracks events apart from the same links on the Overview.
const HEADER_TRACKS_PROPERTIES = { location: 'header' };

// Rows past this fold behind a toggle, so the panel stays short.
const VISIBLE_PLANS = 3;

const STATE_ORDER = { expired: 0, 'expiring-soon': 1, default: 2 };

/**
 * The status line for a plan that needs no attention.
 *
 * @param expiry - The plan's expiry details.
 * @return The status copy.
 */
function getActiveStatus( expiry: ReturnType< typeof getPlanExpiry > ): string {
	if ( expiry.isLifetime || expiry.isOpenEnded ) {
		return __( 'Never expires', 'jetpack-my-jetpack' );
	}
	if ( expiry.isPartnerManaged ) {
		return expiry.message;
	}
	return sprintf(
		// translators: %1$s is the formatted date the plan runs until, i.e.- November 24th, 2024
		__( 'Active until %1$s', 'jetpack-my-jetpack' ),
		expiry.expiryDate
	);
}

/**
 * The status line for an expiring or expired plan.
 *
 * @param expiry - The plan's expiry details.
 * @return The status copy.
 */
function getAttentionStatus( expiry: ReturnType< typeof getPlanExpiry > ): string {
	// The caution icon and colour already say "soon", so the shorter copy fits beside the link.
	return expiry.state === 'expiring-soon'
		? sprintf(
				// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
				__( 'Expires on %1$s', 'jetpack-my-jetpack' ),
				expiry.expiryDate
			)
		: expiry.message;
}

const PlanRow: FC< { purchase: Purchase } > = ( { purchase } ) => {
	const expiry = getPlanExpiry( purchase );
	const { isLifetime, state, action } = expiry;
	const needsAttention = state !== 'default';

	return (
		<li className={ clsx( styles.plan, needsAttention && styles[ state ] ) }>
			<PlanLogo />
			<div className={ styles[ 'plan-body' ] }>
				<Text variant="body-md" className={ styles[ 'plan-name' ] }>
					{ purchase.product_name }
				</Text>
				<div className={ styles[ 'plan-meta' ] }>
					{ needsAttention && <Icon icon={ state === 'expired' ? error : caution } size={ 16 } /> }
					<Text variant="body-sm" className={ styles[ 'plan-status' ] }>
						{ needsAttention ? getAttentionStatus( expiry ) : getActiveStatus( expiry ) }
					</Text>
					{ isLifetime && (
						<GoldenTokenTooltip
							productName={ purchase.product_name }
							giftedDate={ purchase.subscribed_date }
						/>
					) }
				</div>
			</div>
			{ action && (
				<Link href={ action.href } openInNewTab className={ styles[ 'plan-action' ] }>
					{ state === 'expired'
						? _x( 'Resume', 'Resume an expired subscription', 'jetpack-my-jetpack' )
						: _x( 'Renew', 'Renew a subscription', 'jetpack-my-jetpack' ) }
				</Link>
			) }
		</li>
	);
};

/**
 * The site's plans, those that need attention first, with the Overview's plan links.
 *
 * @param props           - Component props.
 * @param props.purchases - The site's purchases, or null until they load.
 * @param props.hasFailed - Whether loading the purchases failed.
 * @return The plans and their links, only the links when the plans fail to load, or nothing while they load.
 */
const PlanSummary: FC< { purchases: Purchase[] | null; hasFailed?: boolean } > = ( {
	purchases,
	hasFailed = false,
} ) => {
	const [ showAll, setShowAll ] = useState( false );
	const toggleShowAll = useCallback( () => setShowAll( value => ! value ), [] );
	// As `Complete::has_required_plan()`: the page state carries no plan flags, and Boost's dashboard no products.
	const hasComplete = !! purchases?.some( ( { product_slug } ) =>
		product_slug?.startsWith( 'jetpack_complete' )
	);
	const isAdmin = !! getMyJetpackWindowInitialState( 'userIsAdmin' );

	if ( ! purchases ) {
		return hasFailed && isAdmin ? (
			<PlanSectionFooter
				numberOfPurchases={ 0 }
				hasComplete={ hasComplete }
				from={ CONNECTION_FROM?.myJetpackHeaderPlans }
				tracksProperties={ HEADER_TRACKS_PROPERTIES }
			/>
		) : null;
	}

	// Array#sort is stable, so plans in the same state keep their order.
	const sorted = [ ...purchases ].sort(
		( a, b ) => STATE_ORDER[ getPlanExpiry( a ).state ] - STATE_ORDER[ getPlanExpiry( b ).state ]
	);
	// Hiding a single plan saves no room over the toggle that would replace it.
	const hiddenCount = sorted.length - VISIBLE_PLANS > 1 ? sorted.length - VISIBLE_PLANS : 0;
	const visible = showAll || ! hiddenCount ? sorted : sorted.slice( 0, VISIBLE_PLANS );

	return (
		<Stack direction="column" gap="md">
			<Text variant="heading-md">
				{ _n( 'Your plan', 'Your plans', purchases.length || 1, 'jetpack-my-jetpack' ) }
			</Text>
			<ul className={ styles.plans }>
				{ purchases.length ? (
					visible.map( purchase => <PlanRow key={ purchase.ID } purchase={ purchase } /> )
				) : (
					<li className={ styles.plan }>
						<PlanLogo />
						<div className={ styles[ 'plan-body' ] }>
							<Text variant="body-md" className={ styles[ 'plan-name' ] }>
								{ __( 'Jetpack Essentials', 'jetpack-my-jetpack' ) }
							</Text>
							<Text variant="body-sm" className={ styles[ 'plan-status' ] }>
								{ __( 'Free', 'jetpack-my-jetpack' ) }
							</Text>
						</div>
					</li>
				) }
			</ul>
			{ hiddenCount > 0 && (
				<Link
					className={ styles[ 'plans-toggle' ] }
					render={ <button type="button" aria-expanded={ showAll } onClick={ toggleShowAll } /> }
				>
					{ showAll
						? __( 'Show fewer plans', 'jetpack-my-jetpack' )
						: sprintf(
								/* translators: %d is the number of plans not shown yet. */
								_n( 'Show %d more plan', 'Show %d more plans', hiddenCount, 'jetpack-my-jetpack' ),
								hiddenCount
							) }
				</Link>
			) }
			{ isAdmin && (
				<div className={ styles[ 'plan-links' ] }>
					<PlanSectionFooter
						numberOfPurchases={ purchases.length }
						hasComplete={ hasComplete }
						from={ CONNECTION_FROM?.myJetpackHeaderPlans }
						tracksProperties={ HEADER_TRACKS_PROPERTIES }
					/>
				</div>
			) }
		</Stack>
	);
};

export default PlanSummary;
