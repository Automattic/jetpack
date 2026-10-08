import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, fetchLog } from '../../data/api';
import type { LogPage, LogRow } from '../../data/types';
import type { Field, Operator, View } from '@wordpress/dataviews';

const STATUS_INTENT = { sent: 'stable', fallback: 'medium', failed: 'high' } as const;

const LogScreen = () => {
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage: 20,
		filters: [],
		fields: [ 'created_at', 'recipients', 'subject', 'status', 'error' ],
	} );
	const [ data, setData ] = useState< LogPage >( { items: [], total: 0 } );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

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
				id: 'created_at',
				label: __( 'Date', 'jetpack-send-pkg' ),
				enableSorting: false,
				enableHiding: false,
				render: ( { item } ) =>
					new Date( `${ item.created_at.replace( ' ', 'T' ) }Z` ).toLocaleString(),
			},
			{ id: 'recipients', label: __( 'Recipients', 'jetpack-send-pkg' ), enableSorting: false },
			{ id: 'subject', label: __( 'Subject', 'jetpack-send-pkg' ), enableSorting: false },
			{
				id: 'status',
				label: __( 'Status', 'jetpack-send-pkg' ),
				enableSorting: false,
				elements: [
					{ value: 'sent', label: __( 'Sent', 'jetpack-send-pkg' ) },
					{ value: 'fallback', label: __( 'Fallback', 'jetpack-send-pkg' ) },
					{ value: 'failed', label: __( 'Failed', 'jetpack-send-pkg' ) },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				render: ( { item } ) => (
					<Badge intent={ STATUS_INTENT[ item.status ] ?? 'none' }>{ item.status }</Badge>
				),
			},
			{ id: 'error', label: __( 'Error', 'jetpack-send-pkg' ), enableSorting: false },
		],
		[]
	);

	const getItemId = useCallback( ( item: LogRow ) => item.id, [] );

	return (
		<>
			{ error && <ErrorNotice message={ error } /> }
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
				defaultLayouts={ { table: {} } }
				empty={ <p>{ __( 'No emails sent through Send yet.', 'jetpack-send-pkg' ) }</p> }
			/>
		</>
	);
};

export default LogScreen;
