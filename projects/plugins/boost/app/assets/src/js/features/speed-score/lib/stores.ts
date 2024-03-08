import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export function useSpeedScoresChange() {
	return useDataSync( 'jetpack_boost_ds', 'speed_scores_change', z.number() );
}
