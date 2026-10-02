/**
 * `CardBody` renders an optional content area for a `Card`.
 * Multiple `CardBody` components can be used within `Card` if needed.
 *
 * ```jsx
 * import { Card, CardBody } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>
 * 		...
 * 	</CardBody>
 * </Card>
 * ```
 */
export declare const CardBody: import("../../context").WordPressComponent<"div", {
    size?: import("../types").SizeOptions | "extraSmall";
} & {
    children: React.ReactNode;
    isShady?: boolean;
} & {
    isScrollable?: boolean;
} & import("react").RefAttributes<any>, true>;
export default CardBody;
//# sourceMappingURL=component.d.ts.map