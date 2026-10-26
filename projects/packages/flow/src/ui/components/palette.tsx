import { Stack, Text } from '@wordpress/ui';
import { startDrag } from '../drag';
import { ProductIcon } from './product-icon';
import type { CatalogItem } from '../types';

type Props = { title: string; kind: 'trigger' | 'action'; items: CatalogItem[] };

/** A cloud of draggable cards. */
export function Palette( { title, kind, items }: Props ) {
	return (
		<Stack direction="column" gap="sm" className="jetpack-flow-palette">
			<Text variant="heading-sm">{ title }</Text>
			<Stack wrap="wrap" gap="sm" role="list">
				{ items.map( item => (
					<div
						key={ item.id }
						role="listitem"
						className={ `jetpack-flow-chip jetpack-flow-chip--${ kind }` }
						draggable
						title={ item.description }
						onDragStart={ event => startDrag( event, { kind, id: item.id } ) }
					>
						<ProductIcon product={ item.product } />
						<Text variant="body-sm">{ item.label }</Text>
					</div>
				) ) }
			</Stack>
		</Stack>
	);
}
