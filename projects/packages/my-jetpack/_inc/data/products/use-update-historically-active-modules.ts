import { useQueryClient } from '@tanstack/react-query';
import {
	QUERY_PRODUCT_BY_OWNERSHIP_KEY,
	QUERY_UPDATE_HISTORICALLY_ACTIVE_MODULES_KEY,
	REST_API_UPDATE_HISTORICALLY_ACTIVE_MODULES,
} from '../constants';
import useSimpleMutation from '../use-simple-mutation';

const useUpdateHistoricallyActiveModules = () => {
	const queryClient = useQueryClient();
	const { mutate: updateHistoricallyActiveModules } = useSimpleMutation< JetpackModule[] >( {
		name: QUERY_UPDATE_HISTORICALLY_ACTIVE_MODULES_KEY,
		query: {
			path: REST_API_UPDATE_HISTORICALLY_ACTIVE_MODULES,
			method: 'POST',
		},
		options: {
			onSuccess: data => {
				// Update window state with new data
				if ( data.length > 0 ) {
					window.myJetpackInitialState.lifecycleStats.historicallyActiveModules = data;
				}
				// Ownership is derived from this list.
				queryClient.invalidateQueries( { queryKey: [ QUERY_PRODUCT_BY_OWNERSHIP_KEY ] } );
			},
		},
	} );

	return updateHistoricallyActiveModules;
};

export default useUpdateHistoricallyActiveModules;
