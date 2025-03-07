import { type SessionsStatus } from '@automattic/jetpack-scan';
import { Tooltip } from '@wordpress/components';
import {
	type SupportedLayouts,
	type View,
	type Field,
	type SortDirection,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon, trash, shield } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import ShieldIcon from '../shield-icon';
import {
	FIELD_USER_ID,
	FIELD_USER_LOGIN,
	FIELD_STATUS,
	FIELD_USER_ROLES,
	FIELD_IP,
	FIELD_LOGIN,
	FIELD_EXPIRATION,
	FIELD_USER_AGENT,
	FIELD_TOKEN,
	FIELD_ICON,
	STATUS_TYPES,
	USER_ROLE_TYPES,
} from './constants';
import SessionsModal from './sessions-modal';
import styles from './styles.module.scss';

/**
 * DataViews component for displaying a sessions report.
 *
 * @param {object}   props                   - Component props.
 * @param {Array}    props.data              - Sessions data.
 * @param {Function} props.onChangeSelection - Callback function to update the selection state.
 * @param {Function} props.terminateSessions - Callback function run when a session is terminated.
 * @param {Function} props.getProfileLink    - Callback function to get the user profile link.
 *
 * @return {JSX.Element} The SessionsReport component.
 */
export default function SessionsReport( {
	data,
	onChangeSelection,
	terminateSessions,
	getProfileLink,
} ): JSX.Element {
	const baseView = {
		search: '',
		filters: [],
		page: 1,
		perPage: 20,
		sort: {
			field: 'status',
			direction: 'asc' as SortDirection,
		},
	};

	/**
	 * DataView default layouts.
	 */
	const defaultLayouts: SupportedLayouts = {
		table: {
			...baseView,
			fields: [
				FIELD_USER_ID,
				FIELD_USER_LOGIN,
				FIELD_USER_ROLES,
				FIELD_IP,
				FIELD_LOGIN,
				FIELD_EXPIRATION,
				FIELD_USER_AGENT,
				FIELD_TOKEN,
			],
			titleField: FIELD_STATUS,
			showMedia: false,
		},
		list: {
			...baseView,
			fields: [ FIELD_USER_ID, FIELD_IP, FIELD_LOGIN, FIELD_EXPIRATION ],
			titleField: FIELD_USER_LOGIN,
			mediaField: FIELD_ICON,
			showMedia: true,
		},
	};

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		...defaultLayouts.table,
	} );

	/**
	 * Users data.
	 */
	const {
		users,
	}: {
		users: { value: string; label: string }[];
	} = useMemo( () => {
		const uniqueUsers = new Map< string, { value: string; label: string } >();
		let hasUnknownUser = false;

		data.forEach( ( { userId, userLogin } ) => {
			const trimmedUserLogin = userLogin.trim();

			if ( ! trimmedUserLogin ) {
				hasUnknownUser = true;
				return;
			}

			if ( ! uniqueUsers.has( String( userId ) ) ) {
				uniqueUsers.set( String( userId ), {
					value: trimmedUserLogin,
					label: trimmedUserLogin,
				} );
			}
		} );

		const usersArray = Array.from( uniqueUsers.values() );

		if ( hasUnknownUser ) {
			usersArray.unshift( { value: '', label: __( 'Unknown', 'jetpack-components' ) } );
		}

		return { users: usersArray };
	}, [ data ] );

	/**
	 * Callback function to handle user login click.
	 *
	 * @param {React.MouseEvent<HTMLAnchorElement>} e - The click event.
	 */
	const handleUserLoginClick = useCallback( ( e: React.MouseEvent< HTMLAnchorElement > ) => {
		e.stopPropagation();
	}, [] );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 */
	const fields = useMemo( () => {
		const result: Field< SessionsStatus >[] = [
			{
				id: FIELD_STATUS,
				label: __( 'Status', 'jetpack-components' ),
				enableSorting: true,
				elements: STATUS_TYPES,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.isSuspicious ? 'suspicious' : 'valid';
				},
				render( { item }: { item: SessionsStatus } ) {
					const text = item.isSuspicious
						? __( 'This session is suspicious.', 'jetpack-components' )
						: __( 'This session is valid.', 'jetpack-components' );
					const variant = item.isSuspicious ? 'warning' : 'success';
					return (
						<Tooltip className={ styles.session__tooltip } text={ text }>
							<div className={ styles.session__icon }>
								<ShieldIcon variant={ variant } height={ 20 } />
							</div>
						</Tooltip>
					);
				},
			},
			{
				id: FIELD_USER_ID,
				label: __( 'ID', 'jetpack-components' ),
				enableHiding: false,
				enableGlobalSearch: true,
				enableSorting: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return String( item.userId );
				},
			},
			{
				id: FIELD_USER_LOGIN,
				label: __( 'User', 'jetpack-components' ),
				enableHiding: false,
				enableGlobalSearch: true,
				enableSorting: true,
				elements: users,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.userLogin.trim() ? item.userLogin : '';
				},
				render( { item }: { item: SessionsStatus } ) {
					return (
						<div>
							{ item.userLogin.trim() ? (
								<a
									href={ getProfileLink( item.userId ) }
									rel="noopener noreferrer"
									onClick={ handleUserLoginClick }
								>
									{ item.userLogin }
								</a>
							) : (
								<div>{ __( 'unknown', 'jetpack-components' ) }</div>
							) }
						</div>
					);
				},
			},
			{
				id: FIELD_USER_ROLES,
				label: __( 'Roles', 'jetpack-components' ),
				enableHiding: false,
				enableSorting: false,
				elements: USER_ROLE_TYPES,
				getValue( { item }: { item: SessionsStatus } ) {
					if ( item.userRoles.length === 0 ) {
						return [ 'unknown' ];
					}

					const coreRoleValues = new Set( USER_ROLE_TYPES.map( role => role.value ) );
					const validRoles = item.userRoles.filter( role => coreRoleValues.has( role ) );
					const hasCustomRole = item.userRoles.some( role => ! coreRoleValues.has( role ) );

					if ( hasCustomRole ) {
						validRoles.push( 'custom' );
					}

					return validRoles.length > 0 ? validRoles : [ 'custom' ];
				},
				render( { item }: { item: SessionsStatus } ) {
					return (
						<div>
							{ item.userRoles.length === 0 ? (
								<div>{ __( 'unknown', 'jetpack-components' ) }</div>
							) : (
								item.userRoles.map( ( role, index ) => <div key={ index }>{ role }</div> )
							) }
						</div>
					);
				},
			},
			{
				id: FIELD_IP,
				label: __( 'IP Address', 'jetpack-components' ),
				enableHiding: false,
				enableGlobalSearch: true,
				enableSorting: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.ip;
				},
			},
			{
				id: FIELD_LOGIN,
				label: __( 'Login', 'jetpack-components' ),
				enableHiding: true,
				enableSorting: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.login;
				},
				render( { item }: { item: SessionsStatus } ) {
					const loginDate = new Date( item.login * 1000 );
					return dateI18n( 'F j, Y g:i a', loginDate );
				},
			},
			{
				id: FIELD_EXPIRATION,
				label: __( 'Expires', 'jetpack-components' ),
				enableHiding: true,
				enableSorting: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.expiration;
				},
				render( { item }: { item: SessionsStatus } ) {
					const expirationDate = new Date( item.expiration * 1000 );
					return dateI18n( 'F j, Y g:i a', expirationDate );
				},
			},
			{
				id: FIELD_USER_AGENT,
				label: __( 'User Agent', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				enableSorting: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.ua;
				},
			},
			{
				id: FIELD_TOKEN,
				label: __( 'Token', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: true,
				getValue( { item }: { item: SessionsStatus } ) {
					return item.token;
				},
				render( { item }: { item: SessionsStatus } ) {
					return item.token;
				},
			},
			...( view.type === 'list'
				? [
						{
							id: FIELD_ICON,
							label: __( 'Icon', 'jetpack-components' ),
							enableSorting: false,
							enableHiding: false,
							render( { item }: { item: SessionsStatus } ) {
								const variant = item.isSuspicious ? 'suspicious' : 'valid';
								return (
									<div className={ `${ styles.session__media } ${ styles[ variant ] }` }>
										<div className={ styles.session__icon }>
											<Icon icon={ shield } />
										</div>
									</div>
								);
							},
						},
				  ]
				: [] ),
		];

		return result;
	}, [ view.type, users, getProfileLink, handleUserLoginClick ] );

	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ sessionsPendingTerminationConfirmation, setSessionsPendingTerminationConfirmation ] =
		useState< SessionsStatus[] >( [] );
	const [ sessionsWithTerminationConfirmation, setSessionsWithTerminationConfirmation ] = useState<
		SessionsStatus[]
	>( [] );

	/**
	 * Callback function to handle modal close.
	 */
	const handleModalClose = useCallback( () => {
		setIsModalOpen( false );
		setSessionsPendingTerminationConfirmation( [] );
		setSessionsWithTerminationConfirmation( [] );
	}, [] );

	/**
	 * Callback function to handle terminate.
	 */
	const handleTerminate = useCallback( ( items: SessionsStatus[] ) => {
		setIsModalOpen( true );
		setSessionsPendingTerminationConfirmation( items );
		setSessionsWithTerminationConfirmation( items );
	}, [] );

	/**
	 * Callback function to handle confirm terminate.
	 */
	const handleConfirmTerminate = useCallback( () => {
		if ( sessionsWithTerminationConfirmation.length === 0 ) {
			return;
		}

		const userSessionTokens = Object.values(
			sessionsWithTerminationConfirmation.reduce( ( acc, { userId, token } ) => {
				if ( ! acc[ userId ] ) {
					acc[ userId ] = { userId, tokens: [] };
				}
				acc[ userId ].tokens.push( token );
				return acc;
			}, {} )
		);
		terminateSessions( userSessionTokens );
		setIsModalOpen( false );
		setSessionsPendingTerminationConfirmation( [] );
		setSessionsWithTerminationConfirmation( [] );
	}, [ terminateSessions, sessionsWithTerminationConfirmation ] );

	/**
	 * DataView actions - defines the available actions for the dataset.
	 */
	const actions = useMemo(
		() => [
			{
				id: 'terminate',
				icon: trash,
				label: items =>
					items.length === 1
						? __( 'Terminate Session', 'jetpack-components' )
						: __( 'Terminate Sessions', 'jetpack-components' ),
				callback: ( items: SessionsStatus[] ) => {
					handleTerminate( items );
				},
				isPrimary: true,
				isDestructive: true,
				supportsBulk: true,
			},
		],
		[ handleTerminate ]
	);

	/**
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

	/**
	 * Callback function to update the view state.
	 */
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 */
	const getItemId = useCallback(
		( item: SessionsStatus ) => `${ item.userId }_${ item.token }`,
		[]
	);

	return (
		<>
			<DataViews
				actions={ actions }
				data={ processedData }
				defaultLayouts={ defaultLayouts }
				fields={ fields }
				getItemId={ getItemId }
				onChangeSelection={ onChangeSelection }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				view={ view }
			/>
			<SessionsModal
				isOpen={ isModalOpen }
				onRequestClose={ handleModalClose }
				onConfirm={ handleConfirmTerminate }
				sessionsPendingTerminationConfirmation={ sessionsPendingTerminationConfirmation }
				sessionsWithTerminationConfirmation={ sessionsWithTerminationConfirmation }
				setSessionsWithTerminationConfirmation={ setSessionsWithTerminationConfirmation }
			/>
		</>
	);
}
