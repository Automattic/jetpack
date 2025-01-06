import { ThreatsDataViews } from '@automattic/jetpack-components';
import { type Threat, HISTORIC_TABLE_FIELDS } from '@automattic/jetpack-scan';
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
			initialFilters={ filters }
			initialFields={ HISTORIC_TABLE_FIELDS }
			onUnignoreThreats={ onUnignoreThreats }
			header={ <ScanToggleGroupControl /> }
		/>
	);
}
