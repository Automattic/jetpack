import { __ } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { startDrag } from '../drag';
import type { CatalogItem } from '../types';

type Props = { title: string; kind: 'trigger' | 'action'; items: CatalogItem[] };

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.kind
 * @param root0.items
 */
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
						draggable={ item.available }
						title={ item.description }
						onDragStart={ event => startDrag( event, { kind, id: item.id } ) }
					>
						<Text variant="body-sm">{ item.label }</Text>
						{ ! item.available && (
							<Badge intent="draft">
								{ item.requires
									? /* translators: %s: plugin name. */ __( 'Needs plugin', 'jetpack-flow-pkg' )
									: __( 'Unavailable', 'jetpack-flow-pkg' ) }
							</Badge>
						) }
					</div>
				) ) }
			</Stack>
		</Stack>
	);
}
