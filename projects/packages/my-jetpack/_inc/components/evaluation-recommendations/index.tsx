import { Container, Col, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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
					{ __( 'Our recommendations for you', 'jetpack-my-jetpack' ) }
				</Text>
			</Col>
			<Col>
				<Text>
					{ __(
						'Here are the features that will best help you protect your site:',
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
