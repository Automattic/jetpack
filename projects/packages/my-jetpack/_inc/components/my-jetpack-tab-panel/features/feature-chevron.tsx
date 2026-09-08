import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Icon, LinkButton, Stack } from '@wordpress/ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureChevronProps = {
	state: FeatureState;
};

/**
 * The labelled chevron at the end of a feature row.
 *
 * An active feature goes straight to where it lives. An inactive one opens its detail
 * page to read about it and switch it on, never the pricing interstitial.
 *
 * @param {FeatureChevronProps} props       - The component props.
 * @param {FeatureState}        props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeatureChevron( { state }: FeatureChevronProps ) {
	const navigate = useNavigate();
	const { recordEvent } = useAnalytics();
	const { feature } = state;
	const isActive = state.status === 'active';
	const chevron = isRTL() ? chevronLeft : chevronRight;

	const onOpenDetail = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_features_detail_click', { feature: feature.slug } );
		navigate( `/feature/${ feature.slug }` );
	}, [ feature.slug, navigate, recordEvent ] );

	const onVisit = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_features_visit_click', { feature: feature.slug } );
	}, [ feature.slug, recordEvent ] );

	const label = (
		<Stack direction="row" align="center" gap="xs">
			{ isActive ? __( 'Go to', 'jetpack-my-jetpack' ) : __( 'Learn more', 'jetpack-my-jetpack' ) }
			<Icon icon={ chevron } size={ 20 } />
		</Stack>
	);

	if ( isActive && feature.manage_url ) {
		return (
			<LinkButton
				href={ feature.manage_url }
				variant="minimal"
				tone="neutral"
				size="compact"
				className={ styles[ 'feature-chevron' ] }
				onClick={ onVisit }
				aria-label={ sprintf(
					/* translators: %s is the feature name. */
					__( 'Go to %s', 'jetpack-my-jetpack' ),
					feature.name
				) }
			>
				{ label }
			</LinkButton>
		);
	}

	return (
		<Button
			variant="minimal"
			tone="neutral"
			size="compact"
			className={ styles[ 'feature-chevron' ] }
			onClick={ onOpenDetail }
			aria-label={ sprintf(
				/* translators: %s is the feature name. */
				__( 'Learn more about %s', 'jetpack-my-jetpack' ),
				feature.name
			) }
		>
			{ label }
		</Button>
	);
}
