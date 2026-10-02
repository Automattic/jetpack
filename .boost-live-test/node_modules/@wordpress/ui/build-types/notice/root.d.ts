import type { RootProps } from './types';
/**
 * A notice component that communicates system status and provides actions.
 *
 * ```jsx
 * import { Notice } from '@wordpress/ui';
 *
 * function MyComponent() {
 * 	return (
 * 		<Notice.Root intent="info">
 * 			<Notice.Title>Heading</Notice.Title>
 * 			<Notice.Description>Body text</Notice.Description>
 * 			<Notice.Actions>
 * 				<Notice.ActionButton>Action</Notice.ActionButton>
 * 			</Notice.Actions>
 * 			<Notice.CloseIcon onClick={() => {}} />
 * 		</Notice.Root>
 * 	);
 * }
 * ```
 */
export declare const Root: import("react").ForwardRefExoticComponent<RootProps & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=root.d.ts.map