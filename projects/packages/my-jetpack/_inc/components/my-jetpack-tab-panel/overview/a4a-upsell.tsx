import { JETPACK_MANAGE_DATA_QUERY } from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import A4ABanner from '../../a4a-banner';
import LoadingBlock from '../../loading-block';
import type { JetpackManageData } from '../../../data/types';

/**
 * Component to display the Automattic for Agencies upsell banner.
 *
 * @return The rendered component
 */
export function A4AUpsell() {
	const { data, isLoading, isError } = useSimpleQuery< JetpackManageData >( {
		...JETPACK_MANAGE_DATA_QUERY,
		// The payload changes at most hourly, and the dismissal mutation updates this cache
		// directly, so refetching on every tab switch would only risk clobbering that write.
		options: { refetchOnMount: false },
	} );

	if ( isLoading ) {
		return <LoadingBlock height="200px" width="100%" />;
	}

	if ( isError || ! data.isEnabled || data.isDismissed ) {
		return null;
	}

	return <A4ABanner isAgencyAccount={ data.isAgencyAccount } />;
}
