import { animated, useSpring } from '@react-spring/web';
import useMeasure from 'react-use-measure';
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button as WPButton,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { JetpackLogo } from '@automattic/jetpack-components';
import useEnterSubPage from '$lib/hooks/use-hide-chassis-chrome';
import { recordBoostEvent } from '$lib/utils/analytics';
import {
	useCriticalCssState,
	useSetProviderErrorDismissedAction,
} from '$features/critical-css/lib/stores/critical-css-state';
import {
	ErrorSet,
	groupErrorsByFrequency,
	groupRecommendationsByStatus,
} from '$features/critical-css/lib/critical-css-errors';
import CriticalCssErrorDescription from '$features/critical-css/error-description/error-description';
import styles from './critical-css-advanced.module.scss';
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
	const navigate = useNavigate();

	useEnterSubPage();

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

	useEffect( () => {
		if ( providersWithIssues.length === 0 ) {
			navigate( '/' );
		}
	}, [ providersWithIssues, navigate ] );

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		navigate( '/' );
	};

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
		<div className={ styles.page }>
			<header className={ `admin-ui-page__header ${ styles.header }` }>
				<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }>
					<HStack
						as="ul"
						className="admin-ui-breadcrumbs__list"
						spacing={ 0 }
						justify="flex-start"
						alignment="center"
					>
						<li>
							<a href="#/" onClick={ handleBack } className={ styles[ 'breadcrumb-link' ] }>
								<JetpackLogo showText={ false } height={ 20 } />
								{ 'Boost' /** "Boost" is a product name, do not translate. */ }
							</a>
						</li>
						<li>
							<h1>{ __( 'Critical CSS recommendations', 'jetpack-boost' ) }</h1>
						</li>
					</HStack>
				</nav>
			</header>

			<Stack direction="column" gap="lg" className={ styles.body }>
				<Card.Root>
					<Card.Content>
						<Stack direction="column" gap="md">
							<Heading heading={ heading } />
							{ dismissedRecommendations.length > 0 && (
								<HeadingMeta
									dismissedIssues={ dismissedRecommendations }
									showDismissedIssues={ showDismissedIssues }
								/>
							) }
						</Stack>
					</Card.Content>
				</Card.Root>

				{ activeRecommendations.map( ( recommendation: ProviderRecommendation ) => (
					<Recommendation
						key={ `${ recommendation.key }-${ recommendation.errorType }` }
						recommendation={ recommendation }
						setDismissed={ setDismissed }
					/>
				) ) }
			</Stack>
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
			<Text ref={ ref } variant="body" render={ <p style={ { margin: 0 } } /> }>
				{ heading }
			</Text>
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
				...animationStyles,
			} }
		>
			<div ref={ ref }>
				<WPButton variant="link" size="small" onClick={ () => setShowHidden( true ) }>
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
				</WPButton>
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

	return errorSets.map( errorSet => (
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
			<div ref={ ref }>
				<Card.Root>
					<Card.Header>
						<Stack direction="row" justify="space-between" align="center" gap="md">
							<Card.Title>{ recommendation.label }</Card.Title>
							<WPButton
								size="small"
								icon={ closeSmall }
								label={ __( 'Dismiss', 'jetpack-boost' ) }
								onClick={ () => setIsDismissed( true ) }
							/>
						</Stack>
					</Card.Header>
					<Card.Content>
						<CriticalCssErrorDescription errorSet={ errorSet } />
					</Card.Content>
				</Card.Root>
			</div>
		</animated.div>
	);
};
