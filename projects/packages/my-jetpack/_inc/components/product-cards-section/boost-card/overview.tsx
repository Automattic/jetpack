import { getScoreTier } from '@automattic/jetpack-boost-score-api';
import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import OverviewItem from '../overview-item';
import useOverviewLoadEvent from '../overview-item/use-overview-load-event';
import useStatusAction from '../overview-item/use-status-action';
import useBoostSpeedScore from './use-boost-speed-score';
import type { OverviewItemLink, OverviewItemProps } from '../overview-item';
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

	// Without a connection or an active Boost, a missing score isn't a failure: the item shows Boost's status.
	const hasFailed = isSpeedScoreError && isSiteConnected && isActive;

	const { recordEvent } = useAnalytics();
	const { action: statusAction, forcedOffReason } = useStatusAction(
		PRODUCT_SLUGS.BOOST,
		__( 'Activate to optimize', 'jetpack-my-jetpack' )
	);

	const getAction = (): OverviewItemLink | undefined => {
		if ( isActive && manageUrl ) {
			return {
				label: __( 'Optimize speed', 'jetpack-my-jetpack' ),
				href: manageUrl,
				onClick: () =>
					recordEvent( 'jetpack_myjetpack_product_card_manage_click', {
						product: PRODUCT_SLUGS.BOOST,
					} ),
			};
		}
		return statusAction;
	};

	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.BOOST }
			admin={ admin }
			label={ __( 'Speed score', 'jetpack-my-jetpack' ) }
			value={ speedLetterGrade || undefined }
			valueTone={
				currentSpeedScore === null ? undefined : TIER_TONES[ getScoreTier( currentSpeedScore ) ]
			}
			action={ getAction() }
			isLoading={ isScoreLoading }
			loadingLabel={ __( 'Checking site speed…', 'jetpack-my-jetpack' ) }
			error={
				hasFailed
					? {
							reason: __( 'Failed to calculate score', 'jetpack-my-jetpack' ),
							onRetry: retry,
						}
					: undefined
			}
			forcedOffReason={ forcedOffReason }
		/>
	);
};

export default BoostOverviewItem;
