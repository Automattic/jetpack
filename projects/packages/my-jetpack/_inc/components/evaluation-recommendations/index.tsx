import { Container, Col, Text } from '@automattic/jetpack-components';
import { DropdownMenu } from '@wordpress/components';
import { Flex } from '@wordpress/components';
import { FlexItem } from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { moreHorizontalMobile } from '@wordpress/icons';
import { useEffect } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useAnalytics from '../../hooks/use-analytics';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';

const EvaluationRecommendations: React.FC = () => {
	const { recordEvent } = useAnalytics();
	const { recommendedModules, redoEvaluation, removeEvaluationResult } =
		useEvaluationRecommendations();

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
							{ _n(
								'Our recommendation for you',
								'Our recommendations for you',
								recommendedModules.length,
								'jetpack-my-jetpack'
							) }
						</Text>
						<Text>
							{ __(
								'Here are the features that will best help you with your site:',
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
									title: __( 'Redo', 'jetpack-my-jetpack' ),
									onClick: redoEvaluation,
								},
								{
									title: __( 'Dismiss', 'jetpack-my-jetpack' ),
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
