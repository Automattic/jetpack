import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Icon, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { FeatureIcon } from './feature-icon';
import styles from './styles.module.scss';

type FeaturePaginationProps = {
	previous?: MainFeature;
	next?: MainFeature;
};

type StepProps = {
	feature: MainFeature;
	direction: 'previous' | 'next';
};

/**
 * One end of the previous/next pair.
 *
 * @param {StepProps}   props           - The component props.
 * @param {MainFeature} props.feature   - The feature to step to.
 * @param {string}      props.direction - Which end of the pair this is.
 * @return The rendered component.
 */
function Step( { feature, direction }: StepProps ) {
	const navigate = useNavigate();
	const isPrevious = direction === 'previous';
	// The arrow follows reading order, so it mirrors in RTL.
	const backwards = isRTL() ? chevronRight : chevronLeft;
	const forwards = isRTL() ? chevronLeft : chevronRight;

	const onClick = useCallback(
		() => navigate( `/feature/${ feature.slug }` ),
		[ feature.slug, navigate ]
	);

	return (
		<button
			type="button"
			className={ styles[ 'feature-step' ] }
			onClick={ onClick }
			aria-label={
				isPrevious
					? sprintf(
							/* translators: %s is the feature name. */
							__( 'Previous feature: %s', 'jetpack-my-jetpack' ),
							feature.name
					  )
					: sprintf(
							/* translators: %s is the feature name. */
							__( 'Next feature: %s', 'jetpack-my-jetpack' ),
							feature.name
					  )
			}
		>
			<Stack direction="row" align="center" gap="sm">
				{ isPrevious ? <Icon icon={ backwards } size={ 20 } /> : null }
				<FeatureIcon feature={ feature } small />
				<Text variant="heading-md">{ feature.name }</Text>
				{ ! isPrevious ? <Icon icon={ forwards } size={ 20 } /> : null }
			</Stack>
		</button>
	);
}

/**
 * Step to the feature either side of this one, in the list's alphabetical order.
 *
 * @param {FeaturePaginationProps} props          - The component props.
 * @param {MainFeature}            props.previous - The preceding feature, if any.
 * @param {MainFeature}            props.next     - The following feature, if any.
 * @return The rendered component.
 */
export function FeaturePagination( { previous, next }: FeaturePaginationProps ) {
	if ( ! previous && ! next ) {
		return null;
	}

	return (
		<nav
			className={ styles[ 'feature-pagination' ] }
			aria-label={ __( 'Feature navigation', 'jetpack-my-jetpack' ) }
		>
			{ previous ? <Step feature={ previous } direction="previous" /> : <span /> }
			{ next ? <Step feature={ next } direction="next" /> : <span /> }
		</nav>
	);
}
