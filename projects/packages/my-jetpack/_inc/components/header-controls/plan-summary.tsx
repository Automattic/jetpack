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
 * @param props.hasFailed - Whether loading the purchases failed.
 * @return The plans and their links, only the links when the plans fail to load, or nothing while they load.
 */
const PlanSummary: FC< { purchases: Purchase[] | null; hasFailed?: boolean } > = ( {
	purchases,
	hasFailed = false,
} ) => {
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
				tracksProperties={ HEADER_TRACKS_PROPERTIES }
			/>
		) : null;
	}

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
			{ isAdmin && (
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
