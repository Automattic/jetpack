import { useCallback } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight, closeSmall, pencil, trash } from '@wordpress/icons';
import { Button, IconButton, Popover, Stack } from '@wordpress/ui';
import { ServiceIcon } from './service-icon';
import type { ButtonStyle, Service, ServiceRow } from '../types';
import type { Dispatch, JSX, SetStateAction } from 'react';

export interface ChipActions {
	onMove: ( row: ServiceRow, index: number, delta: -1 | 1 ) => void;
	onRemove: ( service: Service, row: ServiceRow ) => void;
	onEdit: ( service: Service ) => void;
	onDelete: ( service: Service ) => void;
}

export interface ChipProps extends ChipActions {
	service: Service;
	row: ServiceRow;
	index: number;
	count: number;
	buttonStyle: ButtonStyle;
	selected: boolean;
	onSelect: Dispatch< SetStateAction< string | null > >;
}

/**
 * One sharing button, drawn in the chosen style. Selecting it opens a toolbar, like a block's.
 *
 * @param props             - Props.
 * @param props.service     - Service.
 * @param props.row         - Row it sits in.
 * @param props.index       - Position in the row.
 * @param props.count       - Buttons in the row.
 * @param props.buttonStyle - The site's button style.
 * @param props.selected    - Whether its toolbar is open.
 * @param props.onSelect    - Sets the selected service.
 * @param props.onMove      - Moves it within its row.
 * @param props.onRemove    - Removes it from its row.
 * @param props.onEdit      - Edits a custom service.
 * @param props.onDelete    - Deletes a custom service.
 * @return Button and its toolbar.
 */
export function ServiceChip( {
	service,
	row,
	index,
	count,
	buttonStyle,
	selected,
	onSelect,
	onMove,
	onRemove,
	onEdit,
	onDelete,
}: ChipProps ): JSX.Element {
	const showIcon = buttonStyle !== 'text';
	const showName = buttonStyle !== 'icon';
	// In a right-to-left language the earlier button sits on the right.
	const left = isRTL() ? 1 : -1;
	const right = -left as -1 | 1;
	const canMove = ( delta: number ) => index + delta >= 0 && index + delta < count;

	// Selecting another button opens its toolbar before this one hears the outside click.
	const handleOpenChange = useCallback(
		( open: boolean ) =>
			onSelect( current => {
				if ( open ) {
					return service.id;
				}
				return current === service.id ? null : current;
			} ),
		[ onSelect, service.id ]
	);
	const moveLeft = useCallback( () => onMove( row, index, left ), [ index, left, onMove, row ] );
	const moveRight = useCallback( () => onMove( row, index, right ), [ index, onMove, right, row ] );
	const remove = useCallback( () => onRemove( service, row ), [ onRemove, row, service ] );
	const edit = useCallback( () => onEdit( service ), [ onEdit, service ] );
	const deleteService = useCallback( () => onDelete( service ), [ onDelete, service ] );

	return (
		<Popover.Root open={ selected } onOpenChange={ handleOpenChange }>
			<Popover.Trigger
				render={
					<Button
						variant="outline"
						tone={ selected ? 'brand' : 'neutral' }
						aria-label={ showName ? undefined : service.name }
					/>
				}
			>
				{ showIcon && <ServiceIcon service={ service } /> }
				{ showName && service.name }
			</Popover.Trigger>
			<Popover.Popup positioner={ <Popover.Positioner side="top" sideOffset={ 8 } /> }>
				<Popover.Title className="screen-reader-text">{ service.name }</Popover.Title>
				<Stack
					direction="row"
					align="center"
					gap="xs"
					role="toolbar"
					aria-label={ sprintf(
						/* translators: %s: sharing service name, such as "Facebook". */
						__( '%s options', 'jetpack-sharing-likes' ),
						service.name
					) }
				>
					<IconButton
						icon={ chevronLeft }
						label={ __( 'Move left', 'jetpack-sharing-likes' ) }
						variant="minimal"
						tone="neutral"
						disabled={ ! canMove( left ) }
						focusableWhenDisabled
						onClick={ moveLeft }
					/>
					<IconButton
						icon={ chevronRight }
						label={ __( 'Move right', 'jetpack-sharing-likes' ) }
						variant="minimal"
						tone="neutral"
						disabled={ ! canMove( right ) }
						focusableWhenDisabled
						onClick={ moveRight }
					/>
					<IconButton
						icon={ closeSmall }
						label={ __( 'Remove', 'jetpack-sharing-likes' ) }
						variant="minimal"
						tone="neutral"
						onClick={ remove }
					/>
					{ service.custom && (
						<>
							<IconButton
								icon={ pencil }
								label={ __( 'Edit custom service', 'jetpack-sharing-likes' ) }
								variant="minimal"
								tone="neutral"
								onClick={ edit }
							/>
							<IconButton
								icon={ trash }
								label={ __( 'Delete custom service', 'jetpack-sharing-likes' ) }
								variant="minimal"
								tone="neutral"
								onClick={ deleteService }
							/>
						</>
					) }
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
}
