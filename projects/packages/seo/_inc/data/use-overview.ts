import { REST_NAMESPACE } from '../constants';
import useSimpleQuery from './use-simple-query';
import type { OverviewResponse } from './overview-types';

const useOverview = () =>
	useSimpleQuery< OverviewResponse >( {
		name: 'jetpack-seo-overview',
		query: { path: `/${ REST_NAMESPACE }/overview` },
	} );

export default useOverview;
