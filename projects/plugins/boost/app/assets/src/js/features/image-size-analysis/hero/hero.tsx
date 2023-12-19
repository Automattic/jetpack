import { IconTooltip } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { _n, sprintf } from '@wordpress/i18n';
import styles from './hero.module.scss';
import ImageCdnRecommendation from '$features/image-size-analysis/image-cdn-recommendation/image-cdn-recommendation';
import { type IsaCounts } from '$features/image-size-analysis';

// removed in:fade={{ duration: 300, easing: quadOut }} from .jb-hero

export const Hero = ( {
	isImageCdnModuleActive,
	isaLastUpdated,
	group,
}: {
	isImageCdnModuleActive: boolean;
	isaLastUpdated: number;
	group: IsaCounts;
} ) => {
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );

	const lastUpdated = formatter.format( isaLastUpdated );

	return (
		<>
			{ group && group.total_pages > 0 ? (
				<div className={ classNames( styles.hero, styles[ 'fade-in' ] ) }>
					<span>Latest report as of { lastUpdated }</span>
					{ group.total_pages > 0 && (
						<h1>
							{ sprintf(
								/* translators: %d: number of image recommendations */
								_n(
									'%d Image Recommendation',
									'%d Image Recommendations',
									group.issue_count,
									'jetpack-boost'
								),
								group.issue_count
							) }

							{ ! isImageCdnModuleActive && group.issue_count > 0 && (
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
