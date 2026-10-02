import type { GridProps } from './types';
/**
 * `Grid` is a primitive layout component that can arrange content in a grid configuration.
 *
 * ```jsx
 * import {
 * 	__experimentalGrid as Grid,
 * 	__experimentalText as Text
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Grid columns={ 3 }>
 * 			<Text>Code</Text>
 * 			<Text>is</Text>
 * 			<Text>Poetry</Text>
 * 		</Grid>
 * 	);
 * }
 * ```
 */
export declare const Grid: import("../context").WordPressComponent<"div", GridProps & import("react").RefAttributes<any>, true>;
export default Grid;
//# sourceMappingURL=component.d.ts.map