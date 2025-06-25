import { useSelect } from '@wordpress/data';
import { store as singleStepStore } from '../../../store/form-step-preview';
import useParentFormClientId from './use-parent-form-client-id';

/**
 * A hook to determine if a step is active.
 *
 * @param {string} stepClientId - The client ID of the step block.
 * @return {object} An object containing the isActive boolean.
 */
const useStep = stepClientId => {
	const formClientId = useParentFormClientId( stepClientId );
	const { activeStepId, isSingleStep } = useSelect(
		select => {
			const { getActiveStepId, isSingleStepMode } = select( singleStepStore );
			return {
				activeStepId: getActiveStepId( formClientId ),
				isSingleStep: isSingleStepMode( formClientId ),
			};
		},
		[ formClientId ]
	);

	return {
		isActive: isSingleStep && activeStepId === stepClientId,
	};
};

export default useStep;
