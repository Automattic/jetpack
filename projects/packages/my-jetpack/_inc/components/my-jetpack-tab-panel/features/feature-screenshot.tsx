import { __, sprintf } from '@wordpress/i18n';
import { Skeleton, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import styles from './styles.module.scss';

type FeatureScreenshotProps = {
	feature: MainFeature;
};

/**
 * A screenshot of the feature, served from its own product page on jetpack.com.
 *
 * The frame holds its aspect ratio from the first paint, so the remote image arriving
 * fades in rather than reflowing the page. A missing or moved image falls back to a
 * labelled frame instead of a broken one.
 *
 * @param {FeatureScreenshotProps} props         - The component props.
 * @param {MainFeature}            props.feature - The feature to illustrate.
 * @return The rendered component.
 */
export function FeatureScreenshot( { feature }: FeatureScreenshotProps ) {
	const [ hasLoaded, setHasLoaded ] = useState( false );
	const [ hasFailed, setHasFailed ] = useState( false );

	const onLoad = useCallback( () => setHasLoaded( true ), [] );
	const onError = useCallback( () => setHasFailed( true ), [] );

	if ( ! feature.screenshot || hasFailed ) {
		return (
			<div className={ styles[ 'feature-screenshot__frame' ] }>
				<div className={ styles[ 'feature-screenshot--placeholder' ] }>
					<Text variant="body-sm">
						{ sprintf(
							/* translators: %s is the feature name. */
							__( 'No screenshot available for %s.', 'jetpack-my-jetpack' ),
							feature.name
						) }
					</Text>
				</div>
			</div>
		);
	}

	return (
		<div
			className={ styles[ 'feature-screenshot__frame' ] }
			aria-busy={ ! hasLoaded }
			role="status"
		>
			{ ! hasLoaded && <Skeleton className={ styles[ 'feature-screenshot__skeleton' ] } /> }
			<img
				className={ clsx( styles[ 'feature-screenshot' ], {
					[ styles[ 'feature-screenshot--loaded' ] ]: hasLoaded,
				} ) }
				src={ feature.screenshot }
				onLoad={ onLoad }
				onError={ onError }
				decoding="async"
				fetchPriority="high"
				referrerPolicy="no-referrer"
				alt={ sprintf(
					/* translators: %s is the feature name. */
					__( '%s in use', 'jetpack-my-jetpack' ),
					feature.name
				) }
			/>
		</div>
	);
}
