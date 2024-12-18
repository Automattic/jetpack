import { z } from 'zod';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';

const MinifyDefaults = z.array( z.string() );
type MinifyDefaults = z.infer< typeof MinifyDefaults >;

export function useMinifyDefaults(
	preferenceDSKey: 'minify_js_excludes' | 'minify_css_excludes'
): MinifyDefaults | undefined {
	const [ { data } ] = useDataSync(
		'jetpack_boost_ds',
		`${ preferenceDSKey }_default`,
		MinifyDefaults
	);

	return data;
}
