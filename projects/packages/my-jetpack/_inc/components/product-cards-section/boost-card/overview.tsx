import { getScoreTier } from '@automattic/jetpack-boost-score-api';
import { __ } from '@wordpress/i18n';
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import OverviewItem from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import useBoostSpeedScore from './use-boost-speed-score';
import type { OverviewItemProps } from '../overview-item';
import type { ProductCardComponent } from '../types';
import type { ScoreTier } from '@automattic/jetpack-boost-score-api';

const TIER_TONES: Record< ScoreTier, OverviewItemProps[ 'valueTone' ] > = {
	good: 'good',
	medium: 'warning',
	poor: 'bad',
};

const BoostOverviewItem: ProductCardComponent = ( { admin } ) => {
	const {
		isLoading,
		isSiteConnected,
		speedLetterGrade,
		currentSpeedScore,
		isSpeedScoreError,
		retry,
	} = useBoostSpeedScore();
	const { detail } = useProduct( PRODUCT_SLUGS.BOOST );
	const { status, manageUrl } = detail || {};
	const isActive = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const isScoreLoading = isLoading || ( ! speedLetterGrade && ! isSpeedScoreError );
	useOverviewLoadEvent( PRODUCT_SLUGS.BOOST, isScoreLoading );

	// A disconnected site has no score to fetch, so it shows Boost's status instead of a failure.
	const hasFailed = isSpeedScoreError && isSiteConnected;

	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.BOOST }
			admin={ admin }
			label={ __( 'Speed score', 'jetpack-my-jetpack' ) }
			value={ speedLetterGrade || undefined }
			valueTone={
				currentSpeedScore === null ? undefined : TIER_TONES[ getScoreTier( currentSpeedScore ) ]
			}
			action={
				isActive && manageUrl
					? { label: __( 'Optimize speed', 'jetpack-my-jetpack' ), href: manageUrl }
					: {
							label: __( 'Activate to optimize', 'jetpack-my-jetpack' ),
							href: `#${ MyJetpackRoutes.AddBoost }`,
						}
			}
			isLoading={ isScoreLoading }
			loadingLabel={ __( 'Calculating…', 'jetpack-my-jetpack' ) }
			error={
				hasFailed
					? {
							reason: __( 'Failed to calculate score', 'jetpack-my-jetpack' ),
							onRetry: retry,
						}
					: undefined
			}
		/>
	);
};

export default BoostOverviewItem;
