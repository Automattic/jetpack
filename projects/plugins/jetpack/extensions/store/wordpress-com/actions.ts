/**
 * Types
 */
import type { Plan } from './types';
import type { AiFeatureProps } from './types';

const actions = {
	setPlans( plans: Array< Plan > ) {
		return {
			type: 'SET_PLANS',
			plans,
		};
	},

	fetchFromAPI( url: string ) {
		return {
			type: 'FETCH_FROM_API',
			url,
		};
	},

	storeAiAssistantFeature( feature: AiFeatureProps ) {
		return {
			type: 'STORE_AI_ASSISTANT_FEATURE',
			feature,
		};
	},
};

export default actions;
