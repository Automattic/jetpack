import { Container, Col, Text } from '@automattic/jetpack-components';
import { __, _n } from '@wordpress/i18n';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import { JetpackModuleToProductCard } from '../product-cards-section/all';

const EvaluationRecommendations: React.FC = () => {
	const { isSectionVisible, recommendedModules } = useEvaluationRecommendations();

	if ( ! isSectionVisible ) {
		return null;
	}

	return (
		<Container horizontalGap={ 2 } horizontalSpacing={ 8 }>
			<Col>
				<Text variant="headline-small">
					{ _n(
						'Our recommendation for you',
						'Our recommendations for you',
						recommendedModules.length,
						'jetpack-my-jetpack'
					) }
				</Text>
			</Col>
			<Col>
				<Text>
					{ __(
						'Here are the features that will best help you with your site:',
						'jetpack-my-jetpack'
					) }
				</Text>
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
