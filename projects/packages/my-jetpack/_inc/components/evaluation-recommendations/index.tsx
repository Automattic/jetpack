import { Container, Col, Text } from '@automattic/jetpack-components';
import { Flex, FlexItem, DropdownMenu, Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { moreHorizontalMobile } from '@wordpress/icons';
import { useEffect } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useAnalytics from '../../hooks/use-analytics';
import getPurchasePlanUrl from '../../utils/get-purchase-plan-url';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';
import type { WelcomeFlowExperiment } from '../welcome-flow';

interface Props {
	welcomeFlowExperimentVariation: WelcomeFlowExperiment[ 'variation' ];
}

const EvaluationRecommendations: React.FC< Props > = ( { welcomeFlowExperimentVariation } ) => {
	const { recordEvent } = useAnalytics();
	const { recommendedModules, isFirstRun, redoEvaluation, removeEvaluationResult } =
		useEvaluationRecommendations();
	const isTreatmentVariation = welcomeFlowExperimentVariation === 'treatment';

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
							{ isTreatmentVariation && isFirstRun
								? __( 'Recommended for your site', 'jetpack-my-jetpack' )
								: _n(
										'Our recommendation for you',
										'Our recommendations for you',
										recommendedModules.length,
										'jetpack-my-jetpack'
								  ) }
						</Text>
						{ ! isTreatmentVariation && (
							<Text>
								{ __(
									'Here are the tools that we think will help you reach your website goals:',
									'jetpack-my-jetpack'
								) }
							</Text>
						) }
					</FlexItem>
					<FlexItem>
						<DropdownMenu
							menuProps={ { className: styles[ 'dropdown-menu' ] } }
							popoverProps={ { position: 'bottom left' } }
							icon={ moreHorizontalMobile }
							label={ __( 'Recommendations menu', 'jetpack-my-jetpack' ) }
							controls={ [
								{
									title:
										isTreatmentVariation && isFirstRun
											? __( 'Customize recommendations', 'jetpack-my-jetpack' )
											: __( 'Redo', 'jetpack-my-jetpack' ),
									onClick: redoEvaluation,
								},
								{
									title:
										isTreatmentVariation && isFirstRun
											? __( 'Close', 'jetpack-my-jetpack' )
											: __( 'Dismiss', 'jetpack-my-jetpack' ),
									onClick: removeEvaluationResult,
								},
							] }
						/>
					</FlexItem>
				</Flex>
			</Col>
			<Col>
				<Container
					tagName="ul"
					className={ styles[ 'recommendations-list' ] }
					horizontalGap={ 4 }
					horizontalSpacing={ 2 }
					fluid
				>
					{ recommendedModules.map( module => {
						const Card = JetpackModuleToProductCard[ module ];
						return (
							Card && (
								<Col tagName="li" key={ module } lg={ 4 }>
									<Card recommendation />
								</Col>
							)
						);
					} ) }
				</Container>
			</Col>
			{ isTreatmentVariation && (
				<Col>
					<Flex>
						<FlexItem>
							<Text variant="body">
								{ createInterpolateElement(
									isFirstRun
										? __(
												'Find your perfect match by <link>letting us know what you’re looking for</link>!',
												'jetpack-my-jetpack'
										  )
										: __(
												'Start over? <link>Analyze again for fresh recommendations</link>!',
												'jetpack-my-jetpack'
										  ),
									{
										link: (
											<Button
												variant="link"
												className={ styles[ 'evaluation-footer-link' ] }
												onClick={ redoEvaluation }
											/>
										),
									}
								) }
							</Text>
						</FlexItem>
						<FlexItem>
							<Text variant="body">
								<Button
									variant="link"
									className={ styles[ 'evaluation-footer-link' ] }
									href={ getPurchasePlanUrl() }
									onClick={ null }
								>
									{ __( 'Explore all Jetpack plans', 'jetpack-my-jetpack' ) }
								</Button>
							</Text>
						</FlexItem>
					</Flex>
				</Col>
			) }
		</Container>
	);
};

export default EvaluationRecommendations;
