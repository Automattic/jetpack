import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';

// Per browser, not per user: the tab has no preference of its own yet, and a
// prototype explainer does not earn a REST route to store one.
const STORAGE_KEY = 'jetpack-my-jetpack-features-banner-dismissed';

const wasDismissed = () => {
	try {
		return window.localStorage.getItem( STORAGE_KEY ) === '1';
	} catch {
		return false;
	}
};

/**
 * The dismissible explainer above the features grid.
 *
 * Says what the tab does in the words a site owner would use, and names the one
 * action the page is for. It does not sell: a banner that reads as marketing chrome
 * gets dismissed unread.
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
		setIsDismissed( true );
		recordEvent( 'jetpack_myjetpack_features_banner_dismiss', {} );

		try {
			window.localStorage.setItem( STORAGE_KEY, '1' );
		} catch {
			// A browser that refuses storage just shows the banner again next visit.
		}
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
