import { ThreatsDataViews, HISTORIC_TABLE_FIELDS } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useUnIgnoreThreatMutation from '../../../data/scan/use-unignore-threat-mutation';
import ScanToggleGroupControl from '../scan-toggle-group-control';

/**
 * Scan History Data Viewd
 *
 * @return {JSX.Element} HistoryDataViews component.
 */
export default function HistoryDataViews() {
	const { filter } = useParams();
	const { data: history } = useHistoryQuery();
	const unignoreThreatMutation = useUnIgnoreThreatMutation();

	const filters = useMemo( () => {
		if ( filter ) {
			return [
				{
					field: 'status',
					value: filter,
					operator: 'isAny',
				},
			];
		}
	}, [ filter ] );

	const handleUnignoreClick = useCallback(
		async ( threats: Threat[] ) => {
			await unignoreThreatMutation.mutateAsync( threats[ 0 ].id );
		},
		[ unignoreThreatMutation ]
	);

	return (
		<ThreatsDataViews
			status="historic"
			data={ history ? history.threats : [] }
			initialFilters={ filters }
			initialFields={ HISTORIC_TABLE_FIELDS }
			onUnignoreThreats={ handleUnignoreClick }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
