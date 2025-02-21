import { Critical_CSS_Error_Type, CriticalCssErrorDetails } from './critical-css-state-types';

export type DismissedItem = {
	provider: string;
	dismissed: boolean;
	errorType: Critical_CSS_Error_Type;
};

export type RecommendationProps = {
	recommendation: ProviderRecommendation;
	setDismissed: ( dismissedItems: DismissedItem[] ) => void;
};

export type ProviderRecommendation = {
	key: string;
	label: string;
	errors: CriticalCssErrorDetails[];
	errorType: Critical_CSS_Error_Type;
};
