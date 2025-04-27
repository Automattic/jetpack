import { Container, Col, Text } from '@automattic/jetpack-components';
import { Icon, Flex, FlexItem, DropdownMenu, Button } from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { moreHorizontalMobile, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useEffect, useCallback, useRef } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useAnalytics from '../../hooks/use-analytics';
import LoadingBlock from '../loading-block';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';
import type { FC, RefObject } from 'react';

const EvaluationRecommendations: FC = () => {
	const containerRef = useRef( null );
	const { recordEvent } = useAnalytics();
	const { recommendedModules, redoEvaluation, removeEvaluationResult, isProductOwnershipLoading } =
		useEvaluationRecommendations();
	const [ isAtStart, setIsAtStart ] = useState( true );
	const [ isAtEnd, setIsAtEnd ] = useState( false );

	const checkScrollPosition = useCallback( () => {
		if ( containerRef.current ) {
			const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
			setIsAtStart( scrollLeft === 0 );
			setIsAtEnd( scrollLeft + clientWidth >= scrollWidth );
		}
	}, [ containerRef ] );

	const handleSlide = (
		cardContainerRef: RefObject< HTMLUListElement >,
		direction: number,
		gap: number = 24
	) => {
		if ( cardContainerRef.current ) {
			const cardWidth = cardContainerRef.current.querySelector( 'li' ).clientWidth;

			cardContainerRef.current.scrollBy( {
				left: direction * ( cardWidth + gap ),
				behavior: 'smooth',
			} );
		}
	};

	const handleNextSlide = useCallback( () => {
		handleSlide( containerRef, 1 );

		recordEvent( 'jetpack_myjetpack_recommendations_slide_arrow_click', {
			direction: 'next',
		} );
	}, [ recordEvent, containerRef ] );

	const handlePrevSlide = useCallback( () => {
		handleSlide( containerRef, -1 );
		recordEvent( 'jetpack_myjetpack_recommendations_slide_arrow_click', {
			direction: 'previous',
		} );
	}, [ recordEvent, containerRef ] );

	// We're defining each of these translations in separate variables here, otherwise optimizations in
	// the build step end up breaking the translations and causing error.
	const recommendationsHeadline = _n(
		'Our recommendation for you',
		'Our recommendations for you',
		recommendedModules.length,
		'jetpack-my-jetpack'
	);
	const menuRedoTitle = __( 'Redo', 'jetpack-my-jetpack' );
	const menuDismissTitle = __( 'Dismiss', 'jetpack-my-jetpack' );

	useEffect( () => {
		const container = containerRef.current;

		if ( container ) {
			container.addEventListener( 'scroll', checkScrollPosition );
			checkScrollPosition();

			return () => {
				container.removeEventListener( 'scroll', checkScrollPosition );
			};
		}
	}, [ checkScrollPosition ] );

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_evaluation_recommendations_view', {
			modules: recommendedModules,
		} );
	}, [ recommendedModules, recordEvent ] );

	return (
		<Container horizontalGap={ 2 } horizontalSpacing={ 6 }>
			<Col>
				<Flex>
					<FlexItem>
						<Text variant="headline-small" className={ styles.title }>
							{ recommendationsHeadline }
						</Text>
						<Text>
							{ __(
								'Here are the tools that we think will help you reach your website goals:',
								'jetpack-my-jetpack'
							) }
						</Text>
					</FlexItem>
					<FlexItem>
						<DropdownMenu
							menuProps={ { className: styles[ 'dropdown-menu' ] } }
							popoverProps={ { position: 'bottom left' } }
							icon={ moreHorizontalMobile }
							label={ __( 'Recommendations menu', 'jetpack-my-jetpack' ) }
							controls={ [
								{
									title: menuRedoTitle,
									onClick: redoEvaluation,
								},
								{
									title: menuDismissTitle,
									onClick: removeEvaluationResult,
								},
							] }
						/>
					</FlexItem>
				</Flex>
			</Col>
			<Col>
				<Container
					ref={ containerRef }
					tagName="ul"
					className={ styles[ 'recommendations-list' ] }
					horizontalGap={ 4 }
					horizontalSpacing={ 2 }
					fluid
				>
					{ recommendedModules.map( module => {
						const moduleName = module.replace( 'feature_', '' );
						const Card = JetpackModuleToProductCard[ moduleName ];
						if ( isProductOwnershipLoading ) {
							return (
								<Col tagName="li" key={ module } lg={ 4 }>
									<LoadingBlock width="100%" height="200px" />
								</Col>
							);
						}
						return (
							Card && (
								<Col tagName="li" key={ module } lg={ 4 }>
									<Card recommendation />
								</Col>
							)
						);
					} ) }
				</Container>
				<Flex align="center" justify="center">
					<FlexItem>
						<Button
							className={ clsx( styles[ 'slider-button' ], styles[ 'prev-button' ] ) }
							onClick={ handlePrevSlide }
							disabled={ isAtStart }
							aria-disabled={ isAtStart }
							aria-label={ __( 'Previous', 'jetpack-my-jetpack' ) }
						>
							<Icon icon={ chevronLeft } />
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							className={ clsx( styles[ 'slider-button' ], styles[ 'next-button' ] ) }
							onClick={ handleNextSlide }
							disabled={ isAtEnd }
							aria-disabled={ isAtEnd }
							aria-label={ __( 'Next', 'jetpack-my-jetpack' ) }
						>
							<Icon icon={ chevronRight } />
						</Button>
					</FlexItem>
				</Flex>
			</Col>
		</Container>
	);
};

export default EvaluationRecommendations;
