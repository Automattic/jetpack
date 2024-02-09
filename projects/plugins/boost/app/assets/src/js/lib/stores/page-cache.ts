import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const DiagnosticCheck = z.object( {
	status: z.boolean(),
	error: z.string(),
	message: z.string(),
} );

export const PageCacheDiagnostic = z.object( {
	canBeEnabled: DiagnosticCheck,
} );

export function usePageCacheDiagnosticDS() {
	const [ { data } ] = useDataSync(
		'jetpack_boost_ds',
		'page_cache_diagnostic',
		PageCacheDiagnostic
	);

	return data;
}
