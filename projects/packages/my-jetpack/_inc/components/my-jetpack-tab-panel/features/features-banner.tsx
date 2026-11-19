import HighlightBanner from '@automattic/jetpack-components/highlight-banner';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import useFeaturesBannerDismissal from '../../../data/use-features-banner-dismissal';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';

/**
 * The dismissible explainer above the features grid.
 *
 * @return The rendered component, or null once dismissed.
 */
export function FeaturesBanner() {
	const { recordEvent } = useAnalytics();
	const { isDismissed, dismiss } = useFeaturesBannerDismissal();

	useEffect( () => {
		if ( ! isDismissed ) {
			recordEvent( 'jetpack_myjetpack_features_banner_view', {} );
		}
		// Once per mount, for the view that actually rendered.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const onDismiss = useCallback( () => {
		dismiss();
		recordEvent( 'jetpack_myjetpack_features_banner_dismiss', {} );
	}, [ dismiss, recordEvent ] );

	if ( isDismissed ) {
		return null;
	}

	return (
		<HighlightBanner
			className={ styles.banner }
			title={ __( 'Every Jetpack feature, in one place.', 'jetpack-my-jetpack' ) }
			description={ __(
				'Activate or deactivate a feature right here. Open one first to see what it does, what it needs, and where to find it once it is on.',
				'jetpack-my-jetpack'
			) }
			onDismiss={ onDismiss }
			dismissLabel={ __( 'Dismiss banner', 'jetpack-my-jetpack' ) }
		/>
	);
}
