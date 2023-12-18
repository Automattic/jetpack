import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useCallback } from 'react';
import { z } from 'zod';

const modulesStateSchema = z.record(
	z.string().min( 1 ),
	z.object( {
		active: z.boolean(),
		available: z.boolean(),
	} )
);

export type ModulesState = z.infer< typeof modulesStateSchema >;
export const useModuleState = ( moduleSlug: string, onSuccess?: ( state: boolean ) => void ) => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'modules_state',
		modulesStateSchema
	);

	const setModuleState = useCallback(
		( state: boolean ) => {
			if ( data?.[ moduleSlug ]?.active === state ) {
				return;
			}

			mutate(
				{
					...data,
					[ moduleSlug ]: {
						...data?.[ moduleSlug ],
						active: state,
					},
				},
				{
					onSuccess: moduleStates => {
						// Run the passed on callbacks after the mutation has been applied
						onSuccess?.( moduleStates[ moduleSlug ].active );
					},
				}
			);
		},
		[ data, moduleSlug, mutate, onSuccess ]
	);

	return [ data?.[ moduleSlug ], setModuleState ] as const;
};
