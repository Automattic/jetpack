import { animated, useSpring } from '@react-spring/web';
import useMeasure from 'react-use-measure';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	useCriticalCssState,
	useSetProviderErrorDismissedAction,
} from '$features/critical-css/lib/stores/critical-css-state';
import { getPrimaryGroupedError } from '$features/critical-css/lib/critical-css-errors';
import { BackButton, CloseButton } from '$features/ui';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import InfoIcon from '$svg/info';
import styles from './critical-css-advanced.module.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Provider } from '$features/critical-css';
import clsx from 'clsx';

type HeadingMetaProps = {
	dismissedIssues: Provider[];
	showDismissedIssues: () => void;
};

type RecommendationProps = {
	provider: Provider;
	setDismissed: ( dismissedItems: { key: string; dismissed: boolean }[] ) => void;
};

/**
 * Page for displaying advanced critical CSS recommendations.
 */
export default function AdvancedCriticalCss() {
	const [ cssState ] = useCriticalCssState();
	const setDismissedAction = useSetProviderErrorDismissedAction();

	const issues = cssState.providers.filter( p => p.status === 'error' );
	const activeIssues = issues.filter( issue => issue.error_status !== 'dismissed' );
	const dismissedIssues = issues.filter( issue => issue.error_status === 'dismissed' );

	function setDismissed( data: { key: string; dismissed: boolean }[] ) {
		setDismissedAction.mutate( data );
	}

	// If there are no issues at all, redirect to the main page.
	const navigate = useNavigate();
	useEffect( () => {
		if ( issues.length === 0 ) {
			navigate( '/' );
		}
	}, [ issues, navigate ] );

	const heading =
		activeIssues.length === 0
			? __( 'Congratulations, you have dealt with all the recommendations.', 'jetpack-boost' )
			: __(
					'While Jetpack Boost has been able to automatically generate optimized CSS for most of your important files & sections, we have identified a few more that require your attention.',
					'jetpack-boost'
			  );

	const showDismissedIssues = () => {
		setDismissed( dismissedIssues.map( issue => ( { key: issue.key, dismissed: false } ) ) );
	};

	return (
		<div className="jb-container--narrow jb-critical-css__advanced">
			<BackButton />

			<h3>{ __( 'Critical CSS advanced recommendations', 'jetpack-boost' ) }</h3>

			<section>
				<Heading heading={ heading } />

				{ dismissedIssues.length > 0 && (
					<HeadingMeta
						dismissedIssues={ dismissedIssues }
						showDismissedIssues={ showDismissedIssues }
					/>
				) }
			</section>

			{ activeIssues.map( ( provider: Provider ) => (
				<Recommendation key={ provider.key } provider={ provider } setDismissed={ setDismissed } />
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
					<button className="components-button is-link" onClick={ () => setShowHidden( true ) }>
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
					</button>
				</p>
			</div>
		</animated.div>
	);
};

const Recommendation = ( { provider, setDismissed }: RecommendationProps ) => {
	if ( provider.errors && provider.errors.length === 0 ) {
		return null;
	}

	const errorSet = getPrimaryGroupedError( provider.errors ? provider.errors : [] );
	if ( ! errorSet ) {
		return null;
	}

	const [ isDismissed, setIsDismissed ] = useState( provider.error_status === 'dismissed' );

	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: isDismissed ? 0 : height,
		onRest: isDismissed
			? () => {
					// Send a state update once animation has ended.
					setDismissed( [ { key: provider.key, dismissed: true } ] );
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
					{ provider.label }
				</h4>

				<div className={ styles.problem }>
					<CriticalCssErrorDescription errorSet={ errorSet } />
				</div>
			</div>
		</animated.div>
	);
};
