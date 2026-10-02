/**
 * `Card` provides a flexible and extensible content container.
 * `Card` also provides a convenient set of sub-components such as `CardBody`,
 * `CardHeader`, `CardFooter`, and more.
 *
 * ```jsx
 * import {
 *   Card,
 *   CardHeader,
 *   CardBody,
 *   CardFooter,
 *   __experimentalText as Text,
 *   __experimentalHeading as Heading,
 * } from `@wordpress/components`;
 *
 * function Example() {
 *   return (
 *     <Card>
 *       <CardHeader>
 *         <Heading level={ 4 }>Card Title</Heading>
 *       </CardHeader>
 *       <CardBody>
 *         <Text>Card Content</Text>
 *       </CardBody>
 *       <CardFooter>
 *         <Text>Card Footer</Text>
 *       </CardFooter>
 *     </Card>
 *   );
 * }
 * ```
 */
export declare const Card: import("../../context").WordPressComponent<"div", import("../../surface/types").SurfaceProps & {
    size?: import("../types").SizeOptions | "extraSmall";
} & {
    elevation?: number;
    isBorderless?: boolean;
    isRounded?: boolean;
    isElevated?: boolean;
} & import("react").RefAttributes<any>, true>;
export default Card;
//# sourceMappingURL=component.d.ts.map