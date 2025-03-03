import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

export const SpeculationRulesSchema = z.object( {
	exceptions: z.array( z.string() ),
} );

export const useSpeculationRules = () => {
	return useDataSync( 'jetpack_boost_ds', 'speculation_rules', SpeculationRulesSchema );
};
