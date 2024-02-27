import { REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import type { UseQueryResult } from '@tanstack/react-query';

// TODO: Add type for the response
const useBackupRewindableEvents: () => UseQueryResult< Array< unknown >, Error > = () => {
	return useSimpleQuery( 'backup', REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT );
};

export default useBackupRewindableEvents;
