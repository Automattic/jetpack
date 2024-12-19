import { useRegenerateCriticalCssAction } from './stores/critical-css-state';
import { useCriticalCssRetriedState } from '../critical-css-context/critical-css-context-provider';

/**
 * Helper for "Retry" buttons for Critical CSS which need to track whether they have been clicked
 * before or not in a parent. e.g.: "Retry" buttons in Critical CSS Meta and Cloud CSS Meta.
 *
 * Returns a boolean indicating whether retrying has been attempted, and a function to call to retry.
 */
export function useRetryRegenerate(): [ boolean, () => void ] {
	const [ retried, setRetried ] = useCriticalCssRetriedState();
	const regenerateAction = useRegenerateCriticalCssAction();

	function retry() {
		regenerateAction.mutate();
		setRetried( true );
	}

	return [ retried, retry ];
}
