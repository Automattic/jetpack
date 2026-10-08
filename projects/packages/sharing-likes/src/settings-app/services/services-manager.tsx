import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useServices, useSettings, useStatus } from '../data/queries';
import { useCustomService } from '../data/use-custom-service';
import { useSaveServices, type ServiceLists } from '../data/use-save-services';
import { isPrivateSite } from '../script-data';
import { ConfirmRemovalDialog } from './confirm-removal-dialog';
import { ServiceRow } from './service-row';
import type { Service, ServiceRow as Row, Services, Status } from '../types';
import type { JSX } from 'react';

interface Confirmation {
	kind: 'last' | 'delete';
	service: Service;
	next: ServiceLists;
}

/**
 * Both lists without one service.
 *
 * @param data - Services.
 * @param id   - Service to leave out.
 * @return Lists.
 */
function without( data: Services | undefined, id: string ): ServiceLists {
	return {
		visible: ( data?.visible ?? [] ).filter( other => other !== id ),
		hidden: ( data?.hidden ?? [] ).filter( other => other !== id ),
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
	const [ , setAdding ] = useState< Row | null >( null );
	const [ , setEditing ] = useState< Service | null >( null );
	const [ confirming, setConfirming ] = useState< Confirmation | null >( null );
	const data = query.data;

	const onMove = useCallback(
		( row: Row, index: number, delta: -1 | 1 ) => {
			if ( ! data ) {
				return;
			}
			const ids = [ ...data[ row ] ];
			const [ id ] = ids.splice( index, 1 );
			ids.splice( index + delta, 0, id );
			saveLists( { visible: data.visible, hidden: data.hidden, [ row ]: ids } );
		},
		[ data, saveLists ]
	);

	const onRemove = useCallback(
		( service: Service ) => {
			setSelectedId( null );
			const next = without( data, service.id );
			if ( handsOver( status, next ) ) {
				setConfirming( { kind: 'last', service, next } );
				return;
			}
			saveLists( next, {
				/* translators: %s: sharing service name, such as "Facebook". */
				message: sprintf( __( '%s removed.', 'jetpack-sharing-likes' ), service.name ),
				undoable: true,
			} );
		},
		[ data, saveLists, status ]
	);

	const onDelete = useCallback(
		( service: Service ) => {
			setSelectedId( null );
			setConfirming( { kind: 'delete', service, next: without( data, service.id ) } );
		},
		[ data ]
	);

	const closeConfirmation = useCallback( () => setConfirming( null ), [] );
	const confirm = useCallback( async () => {
		if ( ! confirming ) {
			return;
		}
		setConfirming( null );
		if ( confirming.kind === 'delete' ) {
			await custom.remove( confirming.service.id );
		} else {
			await saveLists( confirming.next );
		}
	}, [ confirming, custom, saveLists ] );

	if ( query.isPending ) {
		return <Spinner />;
	}

	if ( query.isError ) {
		return (
			<Text render={ <p /> }>
				{ __( 'The list of sharing services could not be loaded.', 'jetpack-sharing-likes' ) }
			</Text>
		);
	}

	const { visible, hidden, services } = query.data;
	const byId = new Map( services.map( service => [ service.id, service ] ) );
	// Sharing_Service labels the button "More" beside visible services, "Share" when it stands alone.
	const hasVisible = visible.length > 0;
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
	};

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
				addLabel={ __( 'Add sharing buttons', 'jetpack-sharing-likes' ) }
				ids={ visible }
				{ ...rowProps }
			/>
			<ServiceRow
				row="hidden"
				title={
					hasVisible
						? __( 'Behind the More button', 'jetpack-sharing-likes' )
						: __( 'Behind the Share button', 'jetpack-sharing-likes' )
				}
				addLabel={
					hasVisible
						? __( 'Add to the More button', 'jetpack-sharing-likes' )
						: __( 'Add to the Share button', 'jetpack-sharing-likes' )
				}
				ids={ hidden }
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
			{ confirming && (
				<ConfirmRemovalDialog
					kind={ confirming.kind }
					serviceName={ confirming.service.name }
					handsOver={ handsOver( status, confirming.next ) }
					onConfirm={ confirm }
					onCancel={ closeConfirmation }
				/>
			) }
		</Stack>
	);
}
