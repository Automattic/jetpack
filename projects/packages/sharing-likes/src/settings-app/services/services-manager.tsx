import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useServices, useSettings, useStatus } from '../data/queries';
import { useCustomService } from '../data/use-custom-service';
import { useSaveServices, type ServiceLists } from '../data/use-save-services';
import { isPrivateSite } from '../script-data';
import { AddServicesDialog } from './add-services-dialog';
import { ConfirmRemovalDialog } from './confirm-removal-dialog';
import { EditCustomServiceDialog } from './edit-custom-service-dialog';
import { ServiceRow } from './service-row';
import type { CustomServiceFields, Service, ServiceRow as Row, Services, Status } from '../types';
import type { JSX } from 'react';

interface Confirmation {
	kind: 'last' | 'delete';
	service: Service;
}

/**
 * Both lists without some services.
 *
 * @param data - Services.
 * @param ids  - Services to leave out.
 * @return Lists.
 */
function without( data: Services | undefined, ids: string[] ): ServiceLists {
	return {
		visible: ( data?.visible ?? [] ).filter( other => ! ids.includes( other ) ),
		hidden: ( data?.hidden ?? [] ).filter( other => ! ids.includes( other ) ),
	};
}

/**
 * Whether saving these lists hands a block theme's section over to the block, with no way back here.
 *
 * @param status - Status.
 * @param next   - Lists about to be saved.
 * @return Whether it does.
 */
function handsOver( status: Status | undefined, next: ServiceLists ): boolean {
	return (
		status?.sharing.state === 'configure_with_block_nudge' &&
		next.visible.length + next.hidden.length === 0
	);
}

/**
 * The enabled services as two rows of buttons, with the dialogs that change them.
 *
 * @return Manager.
 */
export function ServicesManager(): JSX.Element {
	const query = useServices( true );
	const settings = useSettings();
	const status = useStatus();
	const saveLists = useSaveServices();
	const custom = useCustomService();
	const [ selectedId, setSelectedId ] = useState< string | null >( null );
	const [ adding, setAdding ] = useState< Row | null >( null );
	const [ editing, setEditing ] = useState< Service | null >( null );
	const [ confirming, setConfirming ] = useState< Confirmation | null >( null );
	const [ focusTarget, setFocusTarget ] = useState< {
		row: Row;
		id: string;
		index: number;
	} | null >( null );
	// Custom services whose delete is in flight: still in the lists, but gone once the save after it lands.
	const deleting = useRef( new Set< string >() );
	const data = query.data;

	const onMove = useCallback(
		( row: Row, index: number, delta: -1 | 1 ) => {
			if ( ! data ) {
				return;
			}
			// The index counts the buttons on screen, which skip IDs whose service is gone.
			const known = new Set( data.services.map( service => service.id ) );
			const ids = data[ row ].filter( other => known.has( other ) );
			const [ id ] = ids.splice( index, 1 );
			ids.splice( index + delta, 0, id );
			saveLists( { visible: data.visible, hidden: data.hidden, [ row ]: ids } );
		},
		[ data, saveLists ]
	);

	const onRemove = useCallback(
		( service: Service, row: Row ) => {
			setSelectedId( null );
			const next = without( data, [ service.id, ...deleting.current ] );
			if ( handsOver( status, next ) ) {
				setConfirming( { kind: 'last', service } );
				return;
			}
			const index = data?.[ row ].indexOf( service.id ) ?? 0;
			setFocusTarget( { row, id: service.id, index } );
			saveLists( next, {
				/* translators: %s: sharing service name, such as "Facebook". */
				message: sprintf( __( '%s removed.', 'jetpack-sharing-likes' ), service.name ),
				undo: { id: service.id, row, index },
			} );
		},
		[ data, saveLists, status ]
	);

	const onDelete = useCallback( ( service: Service ) => {
		setSelectedId( null );
		setConfirming( { kind: 'delete', service } );
	}, [] );

	const closeAdd = useCallback( () => setAdding( null ), [] );
	const onAdd = useCallback(
		( id: string ) => {
			if ( ! data || ! adding ) {
				return;
			}
			saveLists( {
				visible: data.visible,
				hidden: data.hidden,
				[ adding ]: [ ...data[ adding ], id ],
			} );
		},
		[ adding, data, saveLists ]
	);
	const onCreate = useCallback(
		( fields: CustomServiceFields ) => custom.create( fields, adding ?? 'visible' ),
		[ adding, custom ]
	);

	const closeEdit = useCallback( () => setEditing( null ), [] );
	const onSaveEdit = useCallback(
		async ( fields: CustomServiceFields ) => !! editing && custom.update( editing.id, fields ),
		[ custom, editing ]
	);
	const clearFocusTarget = useCallback( () => setFocusTarget( null ), [] );
	const closeConfirmation = useCallback( () => setConfirming( null ), [] );
	const confirm = useCallback( async () => {
		if ( ! confirming ) {
			return;
		}
		setConfirming( null );
		if ( confirming.kind === 'delete' ) {
			const row = data?.hidden.includes( confirming.service.id ) ? 'hidden' : 'visible';
			const index = data?.[ row ].indexOf( confirming.service.id ) ?? -1;
			if ( index >= 0 ) {
				setFocusTarget( { row, id: confirming.service.id, index } );
			}
			deleting.current.add( confirming.service.id );
			await custom.remove( confirming.service.id );
			deleting.current.delete( confirming.service.id );
		} else {
			await saveLists( without( data, [ confirming.service.id, ...deleting.current ] ) );
		}
	}, [ confirming, custom, data, saveLists ] );

	// A save that fails while the dialog is open can put a button back, so this one is no longer the last.
	useEffect( () => {
		if (
			confirming?.kind === 'last' &&
			! handsOver( status, without( data, [ confirming.service.id, ...deleting.current ] ) )
		) {
			setConfirming( null );
		}
	}, [ confirming, data, status ] );

	if ( query.isPending ) {
		return <Spinner />;
	}

	// A failed reread keeps the lists it had, so only a failed first load has nothing to show.
	if ( ! data ) {
		return (
			<Text render={ <p /> }>
				{ __( 'The list of sharing services could not be loaded.', 'jetpack-sharing-likes' ) }
			</Text>
		);
	}

	const { visible, hidden, services } = data;
	const byId = new Map( services.map( service => [ service.id, service ] ) );
	// Sharing_Service labels the button "More" beside visible services, "Share" when it stands alone.
	const hasVisible = visible.length > 0;
	const addVisibleLabel = __( 'Add sharing buttons', 'jetpack-sharing-likes' );
	const addHiddenLabel = hasVisible
		? __( 'Add to the More button', 'jetpack-sharing-likes' )
		: __( 'Add to the Share button', 'jetpack-sharing-likes' );
	const addIntros: Record< Row, string > = {
		visible: __(
			'Choose a service to add it at the end of your buttons.',
			'jetpack-sharing-likes'
		),
		hidden: hasVisible
			? __( 'Choose a service to add it behind the More button.', 'jetpack-sharing-likes' )
			: __( 'Choose a service to add it behind the Share button.', 'jetpack-sharing-likes' ),
	};
	const available = services.filter(
		service =>
			! service.deprecated && ! visible.includes( service.id ) && ! hidden.includes( service.id )
	);
	const shutDown = services.filter(
		service =>
			service.deprecated && ( visible.includes( service.id ) || hidden.includes( service.id ) )
	);
	const rowProps = {
		byId,
		buttonStyle: settings?.button_style ?? 'icon-text',
		selectedId,
		onSelect: setSelectedId,
		onAdd: setAdding,
		onMove,
		onRemove,
		onEdit: setEditing,
		onDelete,
		onFocused: clearFocusTarget,
	};
	const focusAfterFor = ( row: Row ) => ( focusTarget?.row === row ? focusTarget : null );

	return (
		<Stack direction="column" gap="lg">
			{ isPrivateSite() && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ __(
							'Please note that your services have been restricted because your site is private.',
							'jetpack-sharing-likes'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			<ServiceRow
				row="visible"
				title={ __( 'Shown as buttons', 'jetpack-sharing-likes' ) }
				addLabel={ addVisibleLabel }
				ids={ visible }
				focusAfter={ focusAfterFor( 'visible' ) }
				{ ...rowProps }
			/>
			<ServiceRow
				row="hidden"
				title={
					hasVisible
						? __( 'Behind the More button', 'jetpack-sharing-likes' )
						: __( 'Behind the Share button', 'jetpack-sharing-likes' )
				}
				addLabel={ addHiddenLabel }
				ids={ hidden }
				focusAfter={ focusAfterFor( 'hidden' ) }
				{ ...rowProps }
			/>
			{ shutDown.map( service => (
				<Text key={ service.id } render={ <p /> }>
					{ sprintf(
						/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
						__(
							'The %1$s sharing service has shut down or discontinued support for sharing buttons. This sharing button is not displayed to your visitors and should be removed.',
							'jetpack-sharing-likes'
						),
						service.name
					) }
				</Text>
			) ) }
			{ adding && (
				<AddServicesDialog
					title={ adding === 'visible' ? addVisibleLabel : addHiddenLabel }
					intro={ addIntros[ adding ] }
					available={ available }
					onAdd={ onAdd }
					onCreate={ onCreate }
					onClose={ closeAdd }
				/>
			) }
			{ editing && (
				<EditCustomServiceDialog service={ editing } onSave={ onSaveEdit } onClose={ closeEdit } />
			) }
			{ confirming && (
				<ConfirmRemovalDialog
					kind={ confirming.kind }
					serviceName={ confirming.service.name }
					handsOver={
						confirming.kind === 'last' ||
						handsOver( status, without( data, [ confirming.service.id ] ) )
					}
					onConfirm={ confirm }
					onCancel={ closeConfirmation }
				/>
			) }
		</Stack>
	);
}
