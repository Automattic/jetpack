import { IconTooltip, Spinner } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { __, _n, sprintf } from '@wordpress/i18n';
import styles from './hero.module.scss';
import ImageCdnRecommendation from '$features/image-size-analysis/image-cdn-recommendation/image-cdn-recommendation';
import { type IsaCounts } from '$features/image-size-analysis';

const LastUpdated = ( { lastUpdated }: { lastUpdated: number } ) => {
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );

	return (
		<div className={ styles[ 'last-updated' ] }>
			{ sprintf(
				/* translators: %s: date of the latest report */
				__( 'Latest report as of %s', 'jetpack-boost' ),
				formatter.format( lastUpdated )
			) }
		</div>
	);
};

const UpdateInProgress = ( { lastUpdated }: { lastUpdated: number } ) => {
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );

	return (
		<div className={ styles[ 'last-updated' ] }>
			<Spinner color="#23282d" size="1em" />
			{ sprintf(
				/* translators: %s: date of the latest report */
				__( 'Scan started on %s', 'jetpack-boost' ),
				formatter.format( lastUpdated )
			) }
		</div>
	);
};

const Hero = ( {
	isImageCdnModuleActive,
	isaLastUpdated,
	isUpdateInProgress,
	group,
}: {
	isImageCdnModuleActive: boolean;
	isaLastUpdated: number;
	isUpdateInProgress: boolean;
	group?: IsaCounts;
} ) => {
	return (
		<>
			{ group && group.total_pages > 0 ? (
				<div className={ clsx( styles.hero, styles[ 'fade-in' ] ) }>
					{ isUpdateInProgress ? (
						<UpdateInProgress lastUpdated={ isaLastUpdated } />
					) : (
						<LastUpdated lastUpdated={ isaLastUpdated } />
					) }
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

export default Hero;
