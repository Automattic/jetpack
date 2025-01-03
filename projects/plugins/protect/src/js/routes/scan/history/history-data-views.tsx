import { ThreatsDataViews } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useModal from '../../../hooks/use-modal';

/**
 * Scan Results Data View
 *
 * @param {object}      props        - Component props.
 * @param {JSX.Element} props.header - Header component.
 *
 * @return {JSX.Element} ScanResultDataView component.
 */
export default function HistoryDataViews( { header }: { header?: JSX.Element } ) {
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
			data={ history ? history.threats : [] }
			filters={ filters }
			onUnignoreThreats={ onUnignoreThreats }
			header={ header }
		/>
	);
}
