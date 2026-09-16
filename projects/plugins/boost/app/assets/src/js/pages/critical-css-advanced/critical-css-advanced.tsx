import { animated, useSpring } from '@react-spring/web';
import useMeasure from 'react-use-measure';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	getErrorSets,
	useRecommendations,
} from '$features/critical-css/recommendations/use-recommendations';
import { ErrorSet } from '$features/critical-css/lib/critical-css-errors';
import { BackButton, CloseButton } from '$features/ui';
import Collapse from '$features/ui/collapse/collapse';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import InfoIcon from '$svg/info';
import styles from './critical-css-advanced.module.scss';
import { useState } from 'react';
import clsx from 'clsx';
import { Button } from '@automattic/jetpack-components';
import { ProviderRecommendation } from '$features/critical-css/lib/stores/recommendation-types';

type HeadingMetaProps = {
	dismissedIssues: ProviderRecommendation[];
	showDismissedIssues: () => void;
};

/**
 * Page for displaying advanced critical CSS recommendations.
 */
export default function AdvancedCriticalCss() {
	const { activeRecommendations, dismissedRecommendations, dismiss, showDismissed } =
		useRecommendations();

	const heading =
		activeRecommendations.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	return (
		<div className="jb-container--narrow jb-critical-css__advanced">
			<BackButton />

			<h3>{ __( 'Critical CSS advanced recommendations', 'jetpack-boost' ) }</h3>

			<section>
				<Heading heading={ heading } />

				{ dismissedRecommendations.length > 0 && (
					<HeadingMeta
						dismissedIssues={ dismissedRecommendations }
						showDismissedIssues={ showDismissed }
					/>
				) }
			</section>

			{ activeRecommendations.map( ( recommendation: ProviderRecommendation ) => (
				<Recommendation
					key={ `${ recommendation.key }-${ recommendation.errorType }` }
					recommendation={ recommendation }
					onDismiss={ () => dismiss( recommendation ) }
				/>
			) ) }
		</div>
	);
}

const Heading = ( { heading }: { heading: string } ) => {
	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height,
	} );

	return (
		<animated.div style={ animationStyles }>
			<p ref={ ref }>{ heading }</p>
		</animated.div>
	);
};

const HeadingMeta = ( { dismissedIssues, showDismissedIssues }: HeadingMetaProps ) => {
	const [ showHidden, setShowHidden ] = useState( dismissedIssues.length === 0 );

	return (
		<Collapse
			open={ ! showHidden }
			onCollapsed={ showDismissedIssues }
			style={ { overflow: 'hidden', marginTop: 24, marginBottom: 24 } }
		>
			<p style={ { margin: 0 } }>
				<Button variant="link" size="small" onClick={ () => setShowHidden( true ) }>
					{ sprintf(
						/* translators: %d is a number of recommendations which were previously hidden by the user */
						_n(
							'Show %d hidden recommendation.',
							'Show %d hidden recommendations.',
							dismissedIssues.length,
							'jetpack-boost'
						),
						dismissedIssues.length
					) }
				</Button>
			</p>
		</Collapse>
	);
};

type RecommendationComponentProps = {
	recommendation: ProviderRecommendation;
	onDismiss: () => void;
};

const Recommendation = ( { recommendation, onDismiss }: RecommendationComponentProps ) => {
	const errorSets = getErrorSets( recommendation );
	if ( errorSets.length === 0 ) {
		return null;
	}

	return errorSets.map( errorSet => (
		<SingleRecommendation
			key={ `${ recommendation.key }-${ errorSet.type }` }
			recommendation={ recommendation }
			errorSet={ errorSet }
			onDismiss={ onDismiss }
		/>
	) );
};

type SingleRecommendationProps = {
	recommendation: ProviderRecommendation;
	errorSet: ErrorSet;
	onDismiss: () => void;
};

const SingleRecommendation = ( {
	recommendation,
	errorSet,
	onDismiss,
}: SingleRecommendationProps ) => {
	const [ isDismissed, setIsDismissed ] = useState( false );

	return (
		<Collapse
			open={ ! isDismissed }
			onCollapsed={ onDismiss }
			className={ styles[ 'recommendation-animation-wrapper' ] }
			contentClassName={ clsx( 'panel', styles.panel ) }
		>
			<CloseButton onClick={ () => setIsDismissed( true ) } />

			<h4>
				<InfoIcon />
				{ recommendation.label }
			</h4>

			<div className={ styles.problem }>
				<CriticalCssErrorDescription errorSet={ errorSet } />
			</div>
		</Collapse>
	);
};
