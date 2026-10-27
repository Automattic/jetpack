import { Stack, Text } from '@wordpress/ui';
import { startDrag } from '../drag';
import { ProductIcon } from './product-icon';
import type { CatalogItem } from '../types';

type Props = {
	title?: string;
	kind: 'trigger' | 'action';
	items: CatalogItem[];
	/** Called when a card is clicked, as the keyboard and touch alternative to dragging. */
	onPick?: ( item: CatalogItem ) => void;
};

/** A cloud of draggable cards. */
export function Palette( { title, kind, items, onPick }: Props ) {
	return (
		<Stack direction="column" gap="sm" className="jetpack-flow-palette">
			{ title && <Text variant="heading-sm">{ title }</Text> }
			<Stack wrap="wrap" gap="sm">
				{ items.map( item => (
					<button
						type="button"
						key={ item.id }
						className={ `jetpack-flow-chip jetpack-flow-chip--${ kind }` }
						draggable
						title={ item.description }
						onDragStart={ event => startDrag( event, { kind, id: item.id } ) }
						onClick={ () => onPick?.( item ) }
					>
						<ProductIcon product={ item.product } />
						<Text variant="body-sm">{ item.label }</Text>
					</button>
				) ) }
			</Stack>
		</Stack>
	);
}
