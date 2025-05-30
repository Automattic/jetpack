import {
	QUERY_GET_JETPACK_MANAGE_DATA_KEY,
	REST_API_GET_JETPACK_MANAGE_DATA,
} from '../../../data/constants';
import useSimpleQuery from '../../../data/use-simple-query';
import JetpackManageBanner from '../../jetpack-manage-banner';
import LoadingBlock from '../../loading-block';

type JetpackManageData = {
	isEnabled: boolean;
	isAgencyAccount: boolean;
};

/**
 * Component to display the Jetpack Manage upsell banner.
 *
 * @return The rendered component
 */
export function JetpackManageUpsell() {
	const {
		data: jetpackManageData,
		isLoading: isJetpackManageLoading,
		isError: isJetpackManageError,
	} = useSimpleQuery< JetpackManageData >( {
		name: QUERY_GET_JETPACK_MANAGE_DATA_KEY,
		query: { path: REST_API_GET_JETPACK_MANAGE_DATA },
	} );

	return isJetpackManageLoading ? (
		<LoadingBlock height="200px" width="100%" />
	) : (
		! isJetpackManageError && jetpackManageData.isEnabled && (
			<JetpackManageBanner isAgencyAccount={ jetpackManageData.isAgencyAccount } />
		)
	);
}
