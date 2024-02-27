import { REST_API_COUNT_BACKUP_ITEMS_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import type { UseQueryResult } from '@tanstack/react-query';

// TODO: Add type for the response
const useCountBackupItems: () => UseQueryResult< Array< unknown >, Error > = () => {
	return useSimpleQuery( 'backup history', REST_API_COUNT_BACKUP_ITEMS_ENDPOINT );
};

export default useCountBackupItems;
