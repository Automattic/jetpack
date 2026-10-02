/**
 * `CardFooter` renders an optional footer within a `Card`.
 *
 * ```jsx
 * import { Card, CardBody, CardFooter } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardBody>...</CardBody>
 * 	<CardFooter>...</CardFooter>
 * </Card>
 * ```
 */
export declare const CardFooter: import("../../context").WordPressComponent<"div", {
    size?: import("../types").SizeOptions | "extraSmall";
} & {
    children: React.ReactNode;
    isShady?: boolean;
} & {
    isBorderless?: boolean;
} & Partial<import("../../flex/types").FlexProps> & import("react").RefAttributes<any>, true>;
export default CardFooter;
//# sourceMappingURL=component.d.ts.map