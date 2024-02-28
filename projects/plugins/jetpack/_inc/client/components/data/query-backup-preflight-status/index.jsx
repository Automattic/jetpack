import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
	fetchPreflightStatus,
	hasLoadedPreflightStatus,
	isFetchingPreflightStatus,
} from 'state/rewind/preflight';

const QueryBackupPreflightStatus = () => {
	const dispatch = useDispatch();
	const isFetching = useSelector( isFetchingPreflightStatus );
	const hasLoaded = useSelector( hasLoadedPreflightStatus );

	useEffect( () => {
		if ( ! isFetching && ! hasLoaded ) {
			dispatch( fetchPreflightStatus() );
		}
	}, [ isFetching, hasLoaded, dispatch ] );

	return null;
};

export default QueryBackupPreflightStatus;
