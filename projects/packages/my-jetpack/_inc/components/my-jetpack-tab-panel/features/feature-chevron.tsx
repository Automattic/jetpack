import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Icon, Stack } from '@wordpress/ui';
import { useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type FeatureChevronProps = {
	state: FeatureState;
	onOpen: ( slug: string ) => void;
};

/**
 * The labelled chevron at the end of a feature row.
 *
 * Every feature opens its details here, active or not: the modal is where "Go to"
 * lives, so linking straight out would leave an active feature with no way to read
 * about itself.
 *
 * @param {FeatureChevronProps} props        - The component props.
 * @param {FeatureState}        props.state  - Live state for the feature.
 * @param {Function}            props.onOpen - Opens the feature's details.
 * @return The rendered component.
 */
export function FeatureChevron( { state, onOpen }: FeatureChevronProps ) {
	const { recordEvent } = useAnalytics();
	const { feature } = state;
	const chevron = isRTL() ? chevronLeft : chevronRight;

	const onClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_features_detail_click', {
			feature: feature.slug,
			status: state.status,
		} );
		onOpen( feature.slug );
	}, [ feature.slug, onOpen, recordEvent, state.status ] );

	return (
		<Button
			variant="minimal"
			tone="neutral"
			size="compact"
			className={ styles[ 'feature-chevron' ] }
			onClick={ onClick }
			aria-label={ sprintf(
				/* translators: %s is the feature name. */
				__( 'Learn more about %s', 'jetpack-my-jetpack' ),
				feature.name
			) }
		>
			<Stack direction="row" align="center" gap="xs">
				{ __( 'Learn more', 'jetpack-my-jetpack' ) }
				<Icon icon={ chevron } size={ 20 } />
			</Stack>
		</Button>
	);
}
