import { __, _n } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { PlanLogo, PlanSection, PlanSectionFooter } from '../plans-section';
import type { Purchase } from '../../data/types';
import type { FC } from 'react';

// Tells the plan links' Tracks events apart from the same links on the Overview.
const HEADER_TRACKS_PROPERTIES = { location: 'header' };

/**
 * The site's plans, laid out like the Overview's Plan section.
 *
 * @param props           - Component props.
 * @param props.purchases - The site's purchases, or null until they load.
 * @return The plans and their links, or nothing until they load.
 */
const PlanSummary: FC< { purchases: Purchase[] | null } > = ( { purchases } ) => {
	if ( ! purchases ) {
		return null;
	}

	const hasComplete =
		!! getMyJetpackWindowInitialState( 'products' )?.items?.complete?.has_paid_plan_for_product;

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-md">
				{ _n( 'Your plan', 'Your plans', purchases.length || 1, 'jetpack-my-jetpack' ) }
			</Text>
			{ purchases.length ? (
				purchases.map( purchase => (
					<Stack key={ purchase.ID } direction="row" gap="sm" align="start">
						<PlanLogo />
						<PlanSection purchase={ purchase } />
					</Stack>
				) )
			) : (
				<Stack direction="row" gap="sm" align="start">
					<PlanLogo />
					<Text variant="body-md">
						{ __( 'Jetpack Essentials', 'jetpack-my-jetpack' ) }
						<br />
						{ __( 'Free', 'jetpack-my-jetpack' ) }
					</Text>
				</Stack>
			) }
			{ !! getMyJetpackWindowInitialState( 'userIsAdmin' ) && (
				<PlanSectionFooter
					numberOfPurchases={ purchases.length }
					hasComplete={ hasComplete }
					tracksProperties={ HEADER_TRACKS_PROPERTIES }
				/>
			) }
		</Stack>
	);
};

export default PlanSummary;
