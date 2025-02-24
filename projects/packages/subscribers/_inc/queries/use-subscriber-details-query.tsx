import { keepPreviousData, useQuery } from '@tanstack/react-query';
//import wpcom from 'calypso/lib/wp';
import { getSubscriberDetailsCacheKey, getSubscriberDetailsType } from '../helpers';
import type { Subscriber } from '../types';

const useSubscriberDetailsQuery = (
	siteId: number | null,
	subscriptionId: number | undefined,
	userId: number | undefined
) => {
	const type = getSubscriberDetailsType( userId );

	return useQuery< Subscriber >( {
		queryKey: getSubscriberDetailsCacheKey( siteId, subscriptionId, userId, type ),
		queryFn: () => {},
		enabled: !! siteId,
		placeholderData: keepPreviousData,
	} );
};

export default useSubscriberDetailsQuery;
