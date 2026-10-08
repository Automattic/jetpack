import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, fetchLog } from '../../data/api';
import EmailPreview from './email-preview';
import StatusBadge, { logDate, statusLabels } from './status-badge';
import type { LogPage, LogRow } from '../../data/types';
import type { Field, Operator, View } from '@wordpress/dataviews';

const LogScreen = () => {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage: 20,
		filters: [],
		titleField: 'subject',
		fields: [ 'recipients', 'status', 'created_at' ],
	} );
	const [ data, setData ] = useState< LogPage >( { items: [], total: 0 } );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ preview, setPreview ] = useState< LogRow | null >( null );
	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	const statusFilter = String(
		view.filters?.find( filter => filter.field === 'status' )?.value ?? ''
	);
	const page = view.page ?? 1;
	const perPage = view.perPage ?? 20;

	useEffect( () => {
		let cancelled = false;
		setIsLoading( true );
		fetchLog( page, perPage, statusFilter )
			.then( result => {
				if ( ! cancelled ) {
					setData( result );
					setError( null );
				}
			} )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) )
			.finally( () => ! cancelled && setIsLoading( false ) );
		return () => {
			cancelled = true;
		};
	}, [ page, perPage, statusFilter ] );

	const fields = useMemo< Field< LogRow >[] >(
		() => [
			{
				id: 'subject',
				label: __( 'Subject', 'jetpack-send-pkg' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.subject || __( '(No subject)', 'jetpack-send-pkg' ),
			},
			{ id: 'recipients', label: __( 'Recipients', 'jetpack-send-pkg' ), enableSorting: false },
			{
				id: 'status',
				label: __( 'Status', 'jetpack-send-pkg' ),
				enableSorting: false,
				elements: Object.entries( statusLabels() ).map( ( [ value, label ] ) => ( {
					value,
					label,
				} ) ),
				filterBy: { operators: [ 'is' ] as Operator[] },
				render: ( { item } ) => <StatusBadge status={ item.status } error={ item.error } />,
			},
			{
				id: 'created_at',
				label: __( 'Date', 'jetpack-send-pkg' ),
				enableSorting: false,
				render: ( { item } ) => logDate( item.created_at ),
			},
		],
		[]
	);

	const getItemId = useCallback( ( item: LogRow ) => item.id, [] );
	const isItemClickable = useCallback( () => true, [] );
	const onClickItem = useCallback( ( item: LogRow ) => {
		setPreview( item );
		setIsPreviewOpen( true );
	}, [] );
	const closePreview = useCallback( () => setIsPreviewOpen( false ), [] );

	return (
		<div className="jetpack-send-log">
			{ error && (
				<div className="jetpack-send-log__notice">
					<ErrorNotice message={ error } />
				</div>
			) }
			<DataViews
				data={ data.items }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				search={ false }
				paginationInfo={ {
					totalItems: data.total,
					totalPages: Math.max( 1, Math.ceil( data.total / perPage ) ),
				} }
				isLoading={ isLoading }
				getItemId={ getItemId }
				isItemClickable={ isItemClickable }
				onClickItem={ onClickItem }
				defaultLayouts={ { table: {} } }
				empty={ <p>{ __( 'No emails sent through Send yet.', 'jetpack-send-pkg' ) }</p> }
			/>
			<EmailPreview row={ preview } open={ isPreviewOpen } onClose={ closePreview } />
		</div>
	);
};

export default LogScreen;
