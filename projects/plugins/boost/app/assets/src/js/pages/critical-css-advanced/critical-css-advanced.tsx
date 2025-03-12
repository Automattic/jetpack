import { animated, useSpring } from '@react-spring/web';
import useMeasure from 'react-use-measure';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCriticalCssState,
	useSetProviderErrorDismissedAction,
} from '$features/critical-css/lib/stores/critical-css-state';
import {
	ErrorSet,
	groupErrorsByFrequency,
	groupRecommendationsByStatus,
} from '$features/critical-css/lib/critical-css-errors';
import { BackButton, CloseButton } from '$features/ui';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import InfoIcon from '$svg/info';
import styles from './critical-css-advanced.module.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '@automattic/jetpack-components';
import {
	DismissedItem,
	ProviderRecommendation,
	RecommendationProps,
} from '$features/critical-css/lib/stores/recommendation-types';

type HeadingMetaProps = {
	dismissedIssues: ProviderRecommendation[];
	showDismissedIssues: () => void;
};

/**
 * Page for displaying advanced critical CSS recommendations.
 */
export default function AdvancedCriticalCss() {
	const [ cssState ] = useCriticalCssState();
	const setDismissedAction = useSetProviderErrorDismissedAction();

	const providersWithIssues = cssState.providers.filter( p => p.status === 'error' );
	const { activeRecommendations, dismissedRecommendations } =
		groupRecommendationsByStatus( providersWithIssues );

	function setDismissed( data: DismissedItem[] ) {
		setDismissedAction.mutate(
			data.map( item => ( {
				provider: item.provider,
				error_type: item.errorType,
				dismissed: item.dismissed,
			} ) )
		);
	}

	// If there are no issues at all, redirect to the main page.
	const navigate = useNavigate();
	useEffect( () => {
		if ( providersWithIssues.length === 0 ) {
			navigate( '/' );
		}
	}, [ providersWithIssues, navigate ] );
	const heading =
		activeRecommendations.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	const showDismissedIssues = () => {
		setDismissed(
			dismissedRecommendations.map( recommendation => ( {
				provider: recommendation.key,
				errorType: recommendation.errorType,
				dismissed: false,
			} ) )
		);
	};

	return (
		<div className="jb-container--narrow jb-critical-css__advanced">
			<BackButton />

			<h3>{ __( 'Critical CSS advanced recommendations', 'jetpack-boost' ) }</h3>

			<section>
				<Heading heading={ heading } />

				{ dismissedRecommendations.length > 0 && (
					<HeadingMeta
						dismissedIssues={ dismissedRecommendations }
						showDismissedIssues={ showDismissedIssues }
					/>
				) }
			</section>

			{ activeRecommendations.map( ( recommendation: ProviderRecommendation ) => (
				<Recommendation
					key={ `${ recommendation.key }-${ recommendation.errorType }` }
					recommendation={ recommendation }
					setDismissed={ setDismissed }
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

	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: showHidden ? 0 : height,
		onRest: showHidden ? () => showDismissedIssues() : undefined,
	} );

	return (
		<animated.div
			style={ {
				overflow: 'hidden',
				marginTop: 24,
				marginBottom: 24,
				...animationStyles,
			} }
		>
			<div ref={ ref }>
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
			</div>
		</animated.div>
	);
};

const Recommendation = ( { recommendation, setDismissed }: RecommendationProps ) => {
	if ( recommendation.errors && recommendation.errors.length === 0 ) {
		return null;
	}

	const errorSets = groupErrorsByFrequency( recommendation.errors ? recommendation.errors : [] );
	if ( errorSets.length === 0 ) {
		return null;
	}

	return errorSets.map( ( errorSet, _index ) => (
		<SingleRecommendation
			key={ `${ recommendation.key }-${ errorSet.type }` }
			recommendation={ recommendation }
			errorSet={ errorSet }
			setDismissed={ setDismissed }
		/>
	) );
};

type SingleRecommendationProps = {
	recommendation: ProviderRecommendation;
	errorSet: ErrorSet;
	setDismissed: ( dismissedItems: DismissedItem[] ) => void;
};

const SingleRecommendation = ( {
	recommendation,
	errorSet,
	setDismissed,
}: SingleRecommendationProps ) => {
	const [ isDismissed, setIsDismissed ] = useState( false );

	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: isDismissed ? 0 : height,
		onRest: isDismissed
			? () => {
					setDismissed( [
						{
							provider: recommendation.key,
							errorType: recommendation.errorType,
							dismissed: true,
						},
					] );
			  }
			: undefined,
	} );

	return (
		<animated.div
			className={ styles[ 'recommendation-animation-wrapper' ] }
			style={ animationStyles }
		>
			<div ref={ ref } className={ clsx( 'panel', styles.panel ) }>
				<CloseButton onClick={ () => setIsDismissed( true ) } />

				<h4>
					<InfoIcon />
					{ recommendation.label }
				</h4>

				<div className={ styles.problem }>
					<CriticalCssErrorDescription errorSet={ errorSet } />
				</div>
			</div>
		</animated.div>
	);
};
