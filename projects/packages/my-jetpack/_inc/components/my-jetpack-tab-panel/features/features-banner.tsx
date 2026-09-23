import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';

// The page's initial state is a snapshot from the load, so a dismissal made since has to
// outlive this component: switching tabs away and back remounts it.
let dismissedSinceLoad: boolean | null = null;

const wasDismissed = () =>
	dismissedSinceLoad ?? getMyJetpackWindowInitialState( 'featuresBanner' )?.isDismissed === true;

/**
 * The dismissible explainer above the features grid.
 *
 * @return The rendered component, or null once dismissed.
 */
export function FeaturesBanner() {
	const { recordEvent } = useAnalytics();
	const [ isDismissed, setIsDismissed ] = useState( wasDismissed );

	useEffect( () => {
		if ( ! isDismissed ) {
			recordEvent( 'jetpack_myjetpack_features_banner_view', {} );
		}
		// Once per mount, for the view that actually rendered.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const onDismiss = useCallback( () => {
		dismissedSinceLoad = true;
		setIsDismissed( true );
		recordEvent( 'jetpack_myjetpack_features_banner_dismiss', {} );

		apiFetch( {
			path: '/wpcom/v2/my-jetpack/site/features/banner/dismiss',
			method: 'POST',
		} ).catch( () => {
			// Put it back rather than hide a dismissal that the next load would undo.
			dismissedSinceLoad = false;
			setIsDismissed( false );
		} );
	}, [ recordEvent ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<div className={ styles.banner }>
			<div className={ styles.banner__content }>
				<h2 className={ styles.banner__title }>
					{ __( 'Every Jetpack feature, in one place.', 'jetpack-my-jetpack' ) }
				</h2>
				<p className={ styles.banner__description }>
					{ __(
						'Switch a feature on or off right here. Open one first to see what it does, what it needs, and where to find it once it is on.',
						'jetpack-my-jetpack'
					) }
				</p>
			</div>

			<Button
				className={ styles.banner__close }
				icon={ closeSmall }
				label={ __( 'Dismiss', 'jetpack-my-jetpack' ) }
				size="small"
				onClick={ onDismiss }
			/>

			<div className={ `${ styles.banner__orb } ${ styles[ 'banner__orb--top' ] }` } />
			<div className={ `${ styles.banner__orb } ${ styles[ 'banner__orb--bottom' ] }` } />
		</div>
	);
}
