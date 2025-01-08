import { HISTORIC_TABLE_FIELDS } from '@automattic/jetpack-components';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useHistoryQuery from '../../../data/scan/use-history-query';
import ScanDataViews from '../scan-data-views';

/**
 * Scan History Data Viewd
 *
 * @return {JSX.Element} HistoryDataViews component.
 */
export default function HistoryDataViews() {
	const { filter } = useParams();
	const { data: history } = useHistoryQuery();

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

	return (
		<ScanDataViews
			status="historic"
			data={ history ? history.threats : [] }
			initialFilters={ filters }
			initialFields={ HISTORIC_TABLE_FIELDS }
		/>
	);
}
