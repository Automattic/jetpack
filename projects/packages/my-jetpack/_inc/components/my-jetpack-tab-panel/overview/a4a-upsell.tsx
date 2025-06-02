import {
	QUERY_GET_JETPACK_MANAGE_DATA_KEY,
	REST_API_GET_JETPACK_MANAGE_DATA,
} from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import A4ABanner from '../../a4a-banner';
import LoadingBlock from '../../loading-block';

type A4AData = {
	isEnabled: boolean;
	isAgencyAccount: boolean;
};

/**
 * Component to display the Automattic for Agencies upsell banner.
 *
 * @return The rendered component
 */
export function A4AUpsell() {
	const { data, isLoading, isError } = useSimpleQuery< A4AData >( {
		name: QUERY_GET_JETPACK_MANAGE_DATA_KEY,
		query: { path: REST_API_GET_JETPACK_MANAGE_DATA },
	} );

	return isLoading ? (
		<LoadingBlock height="200px" width="100%" />
	) : (
		! isError && data.isEnabled && <A4ABanner isAgencyAccount={ data.isAgencyAccount } />
	);
}
