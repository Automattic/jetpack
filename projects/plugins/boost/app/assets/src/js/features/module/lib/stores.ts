import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const modulesStateSchema = z.record(
	z.string().min( 1 ),
	z.object( {
		active: z.boolean(),
		available: z.boolean(),
	} )
);

export type ModulesState = z.infer< typeof modulesStateSchema >;

export const useModuleState = ( moduleSlug: string ) => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'modules_state',
		modulesStateSchema
	);

	return [
		data?.[ moduleSlug ],
		(
			state: boolean,
			callbacks: {
				onEnable?: () => void;
				onDisable?: () => void;
			} = {}
		) => {
			mutate(
				{
					...data,
					[ moduleSlug ]: {
						...data?.[ moduleSlug ],
						active: state,
					},
				},
				{
					// Run the passed on callbacks after the mutation has been applied
					onSuccess: () => {
						if ( state ) {
							callbacks.onEnable?.();
						} else {
							callbacks.onDisable?.();
						}
					},
				}
			);
		},
	] as const;
};
