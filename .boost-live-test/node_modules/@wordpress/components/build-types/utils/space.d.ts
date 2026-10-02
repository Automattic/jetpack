/**
 * The argument value for the `space()` utility function.
 *
 * When this is a number or a numeric string, it will be interpreted as a
 * multiplier for the grid base value (4px). For example, `space( 2 )` will be 8px.
 *
 * Otherwise, it will be interpreted as a literal CSS length value. For example,
 * `space( 'auto' )` will be 'auto', and `space( '2px' )` will be 2px.
 */
export type SpaceInput = number | string;
/**
 * A function that handles numbers, numeric strings, and unit values.
 *
 * When given a number or a numeric string, it will return the grid-based
 * value as a factor of GRID_BASE, defined above.
 *
 * When given a unit value or one of the named CSS values like `auto`,
 * it will simply return the value back.
 *
 * @param value A number, numeric string, or a unit value.
 */
export declare function space(value?: SpaceInput): string | undefined;
//# sourceMappingURL=space.d.ts.map