import {
	HISTORIC_TABLE_FIELDS,
	THREAT_FIELD_AUTO_FIX,
	ThreatsDataViews,
} from '@automattic/jetpack-components';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useHistoryQuery from '../../../data/scan/use-history-query';
import ScanToggleGroupControl from '../scan-toggle-group-control';

/**
 * Scan History Data Views
 *
 * @return {JSX.Element} HistoryDataViews component.
 */
export default function HistoryDataViews(): JSX.Element {
	const { filter } = useParams();
	const { data: history } = useHistoryQuery();

	const filters = useMemo( () => {
		if ( filter ) {
			return [
				{
					field: 'status',
					value: filter,
					operator: 'isAny' as const,
				},
			];
		}

		return [];
	}, [ filter ] );

	return (
		<ThreatsDataViews
			data={ history ? history.threats : [] }
			initialFilters={ filters }
			initialFields={ HISTORIC_TABLE_FIELDS }
			disableFields={ [ THREAT_FIELD_AUTO_FIX ] }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
