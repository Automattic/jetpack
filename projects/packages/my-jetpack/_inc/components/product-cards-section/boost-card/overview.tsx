import { __ } from '@wordpress/i18n';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import OverviewCard from '../overview-card';
import useBoostSpeedScore from './use-boost-speed-score';
import type { ProductCardComponent } from '../types';

const BoostOverviewCard: ProductCardComponent = ( { admin } ) => {
	const { isLoading, isSiteConnected, speedLetterGrade, isSpeedScoreError, retry } =
		useBoostSpeedScore();

	// A disconnected site has no score to fetch; the product action asks it to connect instead.
	const hasFailed = isSpeedScoreError && isSiteConnected;

	return (
		<OverviewCard
			slug={ PRODUCT_SLUGS.BOOST }
			admin={ admin }
			label={ __( 'Speed score', 'jetpack-my-jetpack' ) }
			value={ speedLetterGrade || undefined }
			primaryActionOverride={ {
				[ PRODUCT_STATUSES.ABSENT ]: {
					label: __( 'Boost your site', 'jetpack-my-jetpack' ),
				},
			} }
			isLoading={ isLoading || ( ! speedLetterGrade && ! isSpeedScoreError ) }
			error={
				hasFailed
					? {
							reason: __( 'Your speed score could not be loaded.', 'jetpack-my-jetpack' ),
							onRetry: retry,
						}
					: undefined
			}
		/>
	);
};

export default BoostOverviewCard;
