import { IconTooltip } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { _n, sprintf } from '@wordpress/i18n';
import styles from './hero.module.scss';
import ImageCdnRecommendation from '$features/image-size-analysis/image-cdn-recommendation/image-cdn-recommendation';

// removed in:fade={{ duration: 300, easing: quadOut }} from .jb-hero

export const Hero = ( {
	isImageCdnModuleActive,
	isaLastUpdated,
	hasActiveGroup,
	totalIssueCount,
} ) => {
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );

	const lastUpdated = formatter.format( isaLastUpdated );
	const showLatestReport = hasActiveGroup && !! isaLastUpdated;

	return (
		<>
			{ showLatestReport ? (
				<div className={ classNames( styles.hero, styles[ 'fade-in' ] ) }>
					<span>Latest report as of { lastUpdated }</span>
					{ totalIssueCount > 0 && (
						<h1>
							{ sprintf(
								/* translators: %d: number of image recommendations */
								_n(
									'%d Image Recommendation',
									'%d Image Recommendations',
									totalIssueCount,
									'jetpack-boost'
								),
								totalIssueCount
							) }

							{ ! isImageCdnModuleActive && totalIssueCount > 0 && (
								<IconTooltip
									title=""
									placement={ 'bottom' }
									className={ styles.tooltip }
									iconSize={ 22 }
									offset={ 20 }
									wide={ true }
								>
									<ImageCdnRecommendation />
								</IconTooltip>
							) }
						</h1>
					) }
				</div>
			) : (
				<>
					<span>&nbsp;</span>
					<h1>&nbsp;</h1>
				</>
			) }
		</>
	);
};
