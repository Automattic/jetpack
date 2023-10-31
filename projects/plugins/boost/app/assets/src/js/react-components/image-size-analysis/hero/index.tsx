import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { RecommendationContext } from '../../recommendation-context';
import styles from './styles.module.scss';

// removed in:fade={{ duration: 300, easing: quadOut }} from .jb-hero

export const Hero = ( {
	needsRefresh,
	refresh,
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
		<div className={ styles.hero }>
			{ showLatestReport && (
				<>
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

							{ ! isImageCdnModuleActive && totalIssueCount > 0 && <RecommendationContext /> }
						</h1>
					) }

					{ needsRefresh && (
						<span>
							{ createInterpolateElement(
								__(
									'More recommendations have been found. <refresh>Refresh</refresh> to see the latest recommendations.',
									'jetpack-boost'
								),
								{
									refresh: (
										// eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid
										<a
											className="action"
											onClick={ event => {
												event.preventDefault();

												refresh();
											} }
											href="#"
										/>
									),
								}
							) }
						</span>
					) }
				</>
			) }
			{ ! showLatestReport && (
				<>
					<span>&nbsp;</span>
					<h1>&nbsp;</h1>
				</>
			) }
		</div>
	);
};
