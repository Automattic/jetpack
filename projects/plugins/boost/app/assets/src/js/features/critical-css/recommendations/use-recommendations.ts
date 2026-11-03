import { useEffect } from 'react';
import {
	groupErrorsByFrequency,
	groupRecommendationsByStatus,
} from '$features/critical-css/lib/critical-css-errors';
import {
	useCriticalCssState,
	useSetProviderErrorDismissedAction,
} from '$features/critical-css/lib/stores/critical-css-state';
import { useBoostNavigation } from '$lib/navigation/navigation-context';
import type {
	DismissedItem,
	ProviderRecommendation,
} from '$features/critical-css/lib/stores/recommendation-types';

/**
 * The advanced recommendations: providers whose Critical CSS failed, split
 * into active and dismissed, with the actions the page offers on them.
 *
 * Leaves for Settings once there is nothing left to recommend.
 */
export function useRecommendations() {
	const [ cssState ] = useCriticalCssState();
	const setDismissedAction = useSetProviderErrorDismissedAction();
	const { returnToSettings } = useBoostNavigation();

	const providersWithIssues = cssState.providers.filter( p => p.status === 'error' );
	const { activeRecommendations, dismissedRecommendations } =
		groupRecommendationsByStatus( providersWithIssues );

	useEffect( () => {
		if ( providersWithIssues.length === 0 ) {
			returnToSettings();
		}
	}, [ providersWithIssues, returnToSettings ] );

	const setDismissed = ( data: DismissedItem[] ) => {
		setDismissedAction.mutate(
			data.map( item => ( {
				provider: item.provider,
				error_type: item.errorType,
				dismissed: item.dismissed,
			} ) )
		);
	};

	const showDismissed = () => {
		setDismissed(
			dismissedRecommendations.map( recommendation => ( {
				provider: recommendation.key,
				errorType: recommendation.errorType,
				dismissed: false,
			} ) )
		);
	};

	const dismiss = ( recommendation: ProviderRecommendation ) => {
		setDismissed( [
			{
				provider: recommendation.key,
				errorType: recommendation.errorType,
				dismissed: true,
			},
		] );
	};

	return { activeRecommendations, dismissedRecommendations, dismiss, showDismissed };
}

/**
 * A recommendation's errors grouped by type, most frequent first.
 *
 * @param recommendation - The recommendation.
 * @return The error sets, empty when there is nothing to show.
 */
export function getErrorSets( recommendation: ProviderRecommendation ) {
	return groupErrorsByFrequency( recommendation.errors ?? [] );
}
