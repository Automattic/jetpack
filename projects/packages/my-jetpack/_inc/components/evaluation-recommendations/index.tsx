import { Container, Col, Text } from '@automattic/jetpack-components';
import { DropdownMenu } from '@wordpress/components';
import { Flex } from '@wordpress/components';
import { FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreHorizontalMobile } from '@wordpress/icons';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import { JetpackModuleToProductCard } from '../product-cards-section/all';
import styles from './style.module.scss';

const EvaluationRecommendations: React.FC = () => {
	const { isSectionVisible, recommendedModules, redoEvaluation, removeEvaluationResult } =
		useEvaluationRecommendations();

	if ( ! isSectionVisible ) {
		return null;
	}

	return (
		<Container horizontalGap={ 2 } horizontalSpacing={ 6 }>
			<Col>
				<Flex>
					<FlexItem>
						<Text variant="headline-small" className={ styles.title }>
							{ __( 'Our recommendations for you', 'jetpack-my-jetpack' ) }
						</Text>
						<Text>
							{ __(
								'Here are the features that will best help you protect your site:',
								'jetpack-my-jetpack'
							) }
						</Text>
					</FlexItem>
					<FlexItem>
						<DropdownMenu
							menuProps={ { className: styles.dropdownMenu } }
							popoverProps={ { position: 'bottom left' } }
							icon={ moreHorizontalMobile }
							label="Recommendations menu"
							controls={ [
								{
									title: 'Redo',
									onClick: redoEvaluation,
								},
								{ title: 'Hide', onClick: removeEvaluationResult },
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
									<Card recommendation={ true } />
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
