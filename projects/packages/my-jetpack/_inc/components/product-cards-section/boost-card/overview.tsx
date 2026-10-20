import { __ } from '@wordpress/i18n';
import { MyJetpackRoutes, PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import OverviewItem from '../overview-item';
import useBoostSpeedScore from './use-boost-speed-score';
import type { OverviewItemProps } from '../overview-item';
import type { ProductCardComponent } from '../types';

const GRADE_TONES: Record< string, OverviewItemProps[ 'valueTone' ] > = {
	A: 'good',
	B: 'good',
	C: 'warning',
	D: 'warning',
	E: 'bad',
	F: 'bad',
};

const BoostOverviewItem: ProductCardComponent = ( { admin } ) => {
	const { isLoading, isSiteConnected, speedLetterGrade, isSpeedScoreError, retry } =
		useBoostSpeedScore();
	const { detail } = useProduct( PRODUCT_SLUGS.BOOST );
	const { status, manageUrl } = detail || {};
	const isActive = status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	// A disconnected site has no score to fetch, so it shows Boost's status instead of a failure.
	const hasFailed = isSpeedScoreError && isSiteConnected;

	return (
		<OverviewItem
			slug={ PRODUCT_SLUGS.BOOST }
			admin={ admin }
			label={ __( 'Speed score', 'jetpack-my-jetpack' ) }
			value={ speedLetterGrade || undefined }
			valueTone={ GRADE_TONES[ speedLetterGrade ] }
			action={
				isActive && manageUrl
					? { label: __( 'Optimize speed', 'jetpack-my-jetpack' ), href: manageUrl }
					: {
							label: __( 'Activate to optimize', 'jetpack-my-jetpack' ),
							href: `#${ MyJetpackRoutes.AddBoost }`,
						}
			}
			isLoading={ isLoading || ( ! speedLetterGrade && ! isSpeedScoreError ) }
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
