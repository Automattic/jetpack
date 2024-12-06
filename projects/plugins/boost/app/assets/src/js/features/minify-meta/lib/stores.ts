import { z } from 'zod';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';

const MinifyDefaults = z.object( {
	js: z.array( z.string() ),
	css: z.array( z.string() ),
} );
type MinifyDefaults = z.infer< typeof MinifyDefaults >;

export function useMinifyDefaults(): MinifyDefaults | undefined {
	const [ { data } ] = useDataSync(
		'jetpack_boost_ds',
		'minify_excludes_defaults',
		MinifyDefaults
	);

	return data;
}
