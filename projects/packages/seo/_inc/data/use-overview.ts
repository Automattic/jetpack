import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { DATA_SYNC_NAMESPACE } from '../constants';
import { OverviewSchema } from './overview-types';

// Read the aggregated Overview state from the `overview` data-sync entry. The
// value is bootstrapped onto the page (`window.jetpack_seo.overview`) by the
// server, so the first render has data without a round-trip. Read-only entry —
// we only use the query half of the `useDataSync` tuple.
const useOverview = () => {
	const [ query ] = useDataSync( DATA_SYNC_NAMESPACE, 'overview', OverviewSchema );
	return query;
};

export default useOverview;
