import useRecommendationsSection from '../../data/recommendations-section/use-recommendations-section';

const EvaluationRecommendations: React.FC = () => {
	const { isSectionVisible, recommendedModules } = useRecommendationsSection();

	if ( ! isSectionVisible ) {
		return null;
	}

	return <>EvaluationRecommendations TBD: { recommendedModules.join( ', ' ) }</>;
};

export default EvaluationRecommendations;
