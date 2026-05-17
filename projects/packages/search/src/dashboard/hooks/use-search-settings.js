import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
import { STORE_ID } from 'store';

/**
 * Provides AI Answers and Instant Search settings from the store,
 * along with a dispatcher for updating them.
 *
 * @return {{ isAiAnswersEnabled: boolean, isInstantSearchEnabled: boolean, setAiAnswersEnabled: Function }} Settings state and updater.
 */
export default function useSearchSettings() {
	const isAiAnswersEnabled = useSelect( select => select( STORE_ID ).isAiAnswersEnabled(), [] );
	const isInstantSearchEnabled = useSelect(
		select => select( STORE_ID ).isInstantSearchEnabled(),
		[]
	);

	const { updateJetpackSettings } = useDispatch( STORE_ID );

	const setAiAnswersEnabled = useCallback(
		value => updateJetpackSettings( { ai_answers_enabled: value } ),
		[ updateJetpackSettings ]
	);

	return { isAiAnswersEnabled, isInstantSearchEnabled, setAiAnswersEnabled };
}
