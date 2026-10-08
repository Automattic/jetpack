import { useCallback, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { Button, Stack, Text } from '@wordpress/ui';
import { ServiceChip, type ChipActions } from './service-chip';
import type { ButtonStyle, Service, ServiceRow as Row } from '../types';
import type { Dispatch, JSX, SetStateAction } from 'react';

export interface RowProps extends ChipActions {
	row: Row;
	title: string;
	addLabel: string;
	ids: string[];
	byId: Map< string, Service >;
	buttonStyle: ButtonStyle;
	selectedId: string | null;
	onSelect: Dispatch< SetStateAction< string | null > >;
	onAdd: ( row: Row ) => void;
}

/**
 * One row of enabled services, in reading order, ending with its own Add button.
 *
 * @param props             - Props.
 * @param props.row         - Which row.
 * @param props.title       - Heading.
 * @param props.addLabel    - Accessible name of the Add button.
 * @param props.ids         - Service IDs, in order.
 * @param props.byId        - Every service, by ID.
 * @param props.buttonStyle - The site's button style.
 * @param props.selectedId  - Service whose toolbar is open.
 * @param props.onSelect    - Sets the selected service.
 * @param props.onAdd       - Opens the Add dialog for this row.
 * @return Row.
 */
export function ServiceRow( {
	row,
	title,
	addLabel,
	ids,
	byId,
	buttonStyle,
	selectedId,
	onSelect,
	onAdd,
	...actions
}: RowProps ): JSX.Element {
	const titleId = useId();
	const handleAdd = useCallback( () => onAdd( row ), [ onAdd, row ] );
	// Unknown IDs come from a service that went away; the server drops them on the next save.
	const present = ids.filter( id => byId.has( id ) );

	return (
		<Stack direction="column" gap="sm">
			<Text variant="heading-sm" render={ <h3 id={ titleId } /> }>
				{ title }
			</Text>
			<Stack
				direction="row"
				gap="sm"
				wrap="wrap"
				align="center"
				role="group"
				aria-labelledby={ titleId }
			>
				{ present.map( ( id, index ) => (
					<ServiceChip
						key={ id }
						service={ byId.get( id ) as Service }
						row={ row }
						index={ index }
						count={ present.length }
						buttonStyle={ buttonStyle }
						selected={ selectedId === id }
						onSelect={ onSelect }
						{ ...actions }
					/>
				) ) }
				<Button variant="minimal" tone="brand" aria-label={ addLabel } onClick={ handleAdd }>
					<Button.Icon icon={ plus } />
					{ __( 'Add', 'jetpack-sharing-likes' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
