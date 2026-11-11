import { CONNECTION_FROM } from '@automattic/jetpack-connection';
import { dateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { caution, error } from '@wordpress/icons';
import { Button, Icon, Link, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { isLifetimePurchase } from '../../utils/is-lifetime-purchase';
import { GoldenTokenTooltip } from '../golden-token/tooltip';
import { PlanLogo, PlanSectionFooter, getManagePurchaseUrl, getRenewUrl } from '../plans-section';
import styles from './style.module.scss';
import type { Purchase } from '../../data/types';
import type { FC, ReactNode } from 'react';

// Tells the plan links' Tracks events apart from the same links on the Overview.
const HEADER_TRACKS_PROPERTIES = { location: 'header' };

// Rows past this fold behind a toggle, so the panel stays short.
const VISIBLE_PLANS = 3;

const STATE_ORDER = { expired: 0, 'expiring-soon': 1, default: 2 };

interface PlanStatus {
	state: keyof typeof STATE_ORDER;
	text: string;
	/** Resume or renew a plan that needs attention. */
	action?: { label: string; href: string };
	/** Names the status icon for screen readers. */
	iconLabel?: string;
}

/**
 * How a plan reads in the header: its state, status line and renew or resume link.
 *
 * @param purchase - A WPCOM purchase.
 * @return The plan's status.
 */
function getPlanStatus( purchase: Purchase ): PlanStatus {
	const { expiry_date, expiry_status, partner_name } = purchase;
	const date = expiry_date ? dateI18n( 'F jS, Y', expiry_date ) : '';

	// As on the Overview, a golden token never expires whatever its status says.
	if ( isLifetimePurchase( purchase ) ) {
		return { state: 'default', text: __( 'Never expires', 'jetpack-my-jetpack' ) };
	}
	if ( date && PRODUCT_STATUSES.EXPIRED === expiry_status ) {
		return {
			state: 'expired',
			// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
			text: sprintf( __( 'Expired on %1$s', 'jetpack-my-jetpack' ), date ),
			action: {
				label: __( 'Resume', 'jetpack-my-jetpack' ),
				href: getManagePurchaseUrl( purchase ),
			},
			iconLabel: __( 'Expired', 'jetpack-my-jetpack' ),
		};
	}
	if ( date && PRODUCT_STATUSES.EXPIRING_SOON === expiry_status ) {
		return {
			state: 'expiring-soon',
			// translators: %1$s is the formatted date to display, i.e.- November 24th, 2024
			text: sprintf( __( 'Expires on %1$s', 'jetpack-my-jetpack' ), date ),
			action: { label: __( 'Renew', 'jetpack-my-jetpack' ), href: getRenewUrl( purchase ) },
			iconLabel: __( 'Expiring soon', 'jetpack-my-jetpack' ),
		};
	}
	if ( ! date && partner_name ) {
		return {
			state: 'default',
			// translators: %1$s is the name of the hosting partner. i.e.- Bluehost, InMotion, Pressable, Jurassic Ninja, etc..
			text: sprintf( __( 'Managed by: %1$s', 'jetpack-my-jetpack' ), partner_name ),
		};
	}
	if ( ! date ) {
		return { state: 'default', text: __( 'Never expires', 'jetpack-my-jetpack' ) };
	}
	return {
		state: 'default',
		// translators: %1$s is the formatted date the plan runs until, i.e.- November 24th, 2024
		text: sprintf( __( 'Active until %1$s', 'jetpack-my-jetpack' ), date ),
	};
}

// Each translated label comes from getPlanStatus(): a ternary between two __() calls here gets
// merged by the minifier into one call, which breaks string extraction in production builds.
const PlanRow: FC< { name: string; status: PlanStatus; children?: ReactNode } > = ( {
	name,
	status: { state, text, action, iconLabel },
	children,
} ) => (
	<li className={ clsx( styles.plan, styles[ state ] ) }>
		<PlanLogo />
		<div className={ styles[ 'plan-body' ] }>
			<Text variant="heading-md">{ name }</Text>
			<div className={ styles[ 'plan-meta' ] }>
				{ iconLabel && (
					<Icon
						icon={ state === 'expired' ? error : caution }
						size={ 16 }
						role="img"
						aria-label={ iconLabel }
					/>
				) }
				<Text variant="body-sm" className={ styles[ 'plan-status' ] }>
					{ text }
				</Text>
				{ children }
			</div>
		</div>
		{ action && (
			<Link href={ action.href } openInNewTab className={ styles[ 'plan-action' ] }>
				{ action.label }
			</Link>
		) }
	</li>
);

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
	// Array#sort is stable, so plans in the same state keep their order.
	const plans = useMemo(
		() =>
			( purchases ?? [] )
				.map( purchase => ( { purchase, status: getPlanStatus( purchase ) } ) )
				.sort( ( a, b ) => STATE_ORDER[ a.status.state ] - STATE_ORDER[ b.status.state ] ),
		[ purchases ]
	);
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

	// Hiding a single plan saves no room over the toggle that would replace it.
	const hiddenCount = plans.length - VISIBLE_PLANS > 1 ? plans.length - VISIBLE_PLANS : 0;
	const visible = showAll || ! hiddenCount ? plans : plans.slice( 0, VISIBLE_PLANS );

	return (
		<Stack direction="column" gap="md">
			<Text variant="heading-md">
				{ _n( 'Your plan', 'Your plans', purchases.length || 1, 'jetpack-my-jetpack' ) }
			</Text>
			<ul className={ styles.plans }>
				{ purchases.length ? (
					visible.map( ( { purchase, status } ) => (
						<PlanRow key={ purchase.ID } name={ purchase.product_name } status={ status }>
							{ isLifetimePurchase( purchase ) && (
								<GoldenTokenTooltip
									productName={ purchase.product_name }
									giftedDate={ purchase.subscribed_date }
								/>
							) }
						</PlanRow>
					) )
				) : (
					<PlanRow
						name={ __( 'Jetpack Essentials', 'jetpack-my-jetpack' ) }
						status={ { state: 'default', text: __( 'Free', 'jetpack-my-jetpack' ) } }
					/>
				) }
			</ul>
			{ hiddenCount > 0 && (
				<Link
					className={ styles[ 'plans-toggle' ] }
					render={
						<Button variant="unstyled" aria-expanded={ showAll } onClick={ toggleShowAll } />
					}
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
