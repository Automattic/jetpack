import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const useGettingStarted = () => {
	const [ { data }, { mutateAsync } ] = useDataSync(
		'jetpack_boost_ds',
		'getting_started',
		z.boolean()
	);

	return {
		shouldGetStarted: data,
		markGettingStartedComplete: async () => await mutateAsync( false ),
	};
};
