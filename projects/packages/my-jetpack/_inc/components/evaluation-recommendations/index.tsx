import { Container, Col, Text } from '@automattic/jetpack-components';
import { Flex, FlexItem, DropdownMenu } from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { moreHorizontalMobile } from '@wordpress/icons';
import { useEffect } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useAnalytics from '../../hooks/use-analytics';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';
import type { FC } from 'react';

const EvaluationRecommendations: FC = () => {
	const { recordEvent } = useAnalytics();
	const { recommendedModules, redoEvaluation, removeEvaluationResult } =
		useEvaluationRecommendations();

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
		</Container>
	);
};

export default EvaluationRecommendations;
