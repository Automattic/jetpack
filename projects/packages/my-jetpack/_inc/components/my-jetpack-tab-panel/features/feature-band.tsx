import { __, sprintf } from '@wordpress/i18n';
import { Icon, Skeleton } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { getFeatureIcon } from './icons';
import styles from './styles.module.scss';

type FeatureBandProps = {
	feature: MainFeature;
};

/**
 * The artwork across the top of a feature's modal, served from jetpack.com.
 *
 * The band paints its own ground, so a missing or moved image leaves the feature's
 * glyph on brand colour rather than a hole.
 *
 * @param {FeatureBandProps} props         - The component props.
 * @param {MainFeature}      props.feature - The feature to illustrate.
 * @return The rendered component.
 */
export function FeatureBand( { feature }: FeatureBandProps ) {
	const [ hasLoaded, setHasLoaded ] = useState( false );
	const [ hasFailed, setHasFailed ] = useState( false );

	const onLoad = useCallback( () => setHasLoaded( true ), [] );
	const onError = useCallback( () => setHasFailed( true ), [] );

	if ( ! feature.screenshot || hasFailed ) {
		return (
			<span className={ styles[ 'modal-band__glyph' ] } aria-hidden="true">
				<Icon icon={ getFeatureIcon( feature.icon ) } size={ 48 } />
			</span>
		);
	}

	return (
		<>
			{ ! hasLoaded && <Skeleton className={ styles[ 'modal-band__skeleton' ] } /> }
			<img
				className={ clsx( styles[ 'modal-band__image' ], {
					[ styles[ 'modal-band__image--loaded' ] ]: hasLoaded,
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
		</>
	);
}
