import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const useGettingStarted = () => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'getting_started',
		z.boolean()
	);

	return {
		shouldGetStarted: data,
		markGettingStartedComplete: () => mutate( false ),
	};
};
