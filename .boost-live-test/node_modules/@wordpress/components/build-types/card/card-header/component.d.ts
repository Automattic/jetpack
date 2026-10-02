/**
 * `CardHeader` renders an optional header within a `Card`.
 *
 * ```jsx
 * import { Card, CardBody, CardHeader } from `@wordpress/components`;
 *
 * <Card>
 * 	<CardHeader>...</CardHeader>
 * 	<CardBody>...</CardBody>
 * </Card>
 * ```
 */
export declare const CardHeader: import("../../context").WordPressComponent<"div", {
    size?: import("../types").SizeOptions | "extraSmall";
} & {
    children: React.ReactNode;
    isShady?: boolean;
} & {
    isBorderless?: boolean;
} & Partial<import("../../flex/types").FlexProps> & import("react").RefAttributes<any>, true>;
export default CardHeader;
//# sourceMappingURL=component.d.ts.map