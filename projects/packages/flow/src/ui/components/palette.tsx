import { Stack, Text } from '@wordpress/ui';
import { ProductIcon } from './product-icon';
import type { CatalogItem } from '../types';

type Props = {
	kind: 'trigger' | 'action';
	items: CatalogItem[];
	onPick: ( item: CatalogItem ) => void;
};

/** A cloud of clickable chips. */
export function Palette( { kind, items, onPick }: Props ) {
	return (
		<Stack wrap="wrap" gap="sm" className="jetpack-flow-palette">
			{ items.map( item => (
				<button
					type="button"
					key={ item.id }
					className={ `jetpack-flow-chip jetpack-flow-chip--${ kind }` }
					title={ item.description }
					onClick={ () => onPick( item ) }
				>
					<ProductIcon product={ item.product } />
					<Text variant="body-sm">{ item.label }</Text>
				</button>
			) ) }
		</Stack>
	);
}
