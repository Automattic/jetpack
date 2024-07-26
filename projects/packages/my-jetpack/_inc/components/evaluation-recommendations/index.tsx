import { Container, Col, Text } from '@automattic/jetpack-components';
import { DropdownMenu } from '@wordpress/components';
import { Flex } from '@wordpress/components';
import { FlexItem } from '@wordpress/components';
import { __, _n } from '@wordpress/i18n';
import { moreHorizontalMobile } from '@wordpress/icons';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';

const EvaluationRecommendations: React.FC = () => {
	const { recommendedModules, redoEvaluation, removeEvaluationResult } =
		useEvaluationRecommendations();

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
							menuProps={ { className: styles.dropdownMenu } }
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
				<Container horizontalGap={ 4 } horizontalSpacing={ 2 } fluid>
					{ recommendedModules.map( module => {
						const Card = JetpackModuleToProductCard[ module ];
						return (
							Card && (
								<Col key={ module } lg={ 4 }>
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
