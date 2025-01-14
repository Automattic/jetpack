import { ThreatsDataViews, HISTORIC_TABLE_FIELDS } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useModal from '../../../hooks/use-modal';
import ScanToggleGroupControl from '../scan-toggle-group-control';

/**
 * Scan History Data Viewd
 *
 * @return {JSX.Element} HistoryDataViews component.
 */
export default function HistoryDataViews() {
	const { filter } = useParams();
	const { data: history } = useHistoryQuery();
	const { setModal } = useModal();

	// Apply initial status filtering based on optional params from the URL.
	const initialFilters = useMemo(
		() =>
			filter
				? [
						{
							field: 'status' as const,
							value: filter,
							operator: 'isAny' as const,
						},
				  ]
				: [],
		[ filter ]
	);

	const onUnignoreThreats = useCallback(
		( threats: Threat[] ) => {
			setModal( { type: 'UNIGNORE_THREAT', props: { threat: threats[ 0 ] } } );
		},
		[ setModal ]
	);

	return (
		<ThreatsDataViews
			status="historic"
			data={ history ? history.threats : [] }
			initialFilters={ initialFilters }
			initialFields={ HISTORIC_TABLE_FIELDS }
			onUnignoreThreats={ onUnignoreThreats }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
