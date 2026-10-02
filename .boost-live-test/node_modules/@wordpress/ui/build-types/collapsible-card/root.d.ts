import type { RootProps } from './types';
/**
 * A card that can be expanded and collapsed. When collapsed, only the
 * header is visible.
 *
 * ```jsx
 * import { CollapsibleCard, Card } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<CollapsibleCard.Root defaultOpen>
 * 			<CollapsibleCard.Header>
 * 				<Card.Title>Heading</Card.Title>
 * 			</CollapsibleCard.Header>
 * 			<CollapsibleCard.Content>
 * 				<p>Collapsible content here.</p>
 * 			</CollapsibleCard.Content>
 * 		</CollapsibleCard.Root>
 * 	);
 * }
 * ```
 */
export declare const Root: import("react").ForwardRefExoticComponent<RootProps & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=root.d.ts.map