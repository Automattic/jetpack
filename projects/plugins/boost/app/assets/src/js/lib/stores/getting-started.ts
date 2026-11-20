import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import { ONBOARDING_SAVE_META } from '../../../../../../_inc/overview/lib/modules-state-bridge';

export const useGettingStarted = () => {
	const [ { data }, { mutateAsync } ] = useDataSync(
		'jetpack_boost_ds',
		'getting_started',
		z.boolean(),
		{ mutation: { meta: ONBOARDING_SAVE_META } }
	);

	return {
		shouldGetStarted: Boolean( data ),
		markGettingStartedComplete: async () => await mutateAsync( false ),
	};
};
