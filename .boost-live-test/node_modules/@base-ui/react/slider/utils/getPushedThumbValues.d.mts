/**
 * Returns a new array of slider values where attempting to move the thumb at `index`
 * beyond its neighbours "pushes" them while respecting `minStepsBetweenValues`.
 *
 * Positional arguments are deliberate: property names of an options object don't
 * minify, so passing them positionally keeps this internal helper smaller in the bundle.
 */
export declare function getPushedThumbValues(values: readonly number[], index: number, nextValue: number, min: number, max: number, step: number, minStepsBetweenValues: number, initialValues?: readonly number[] | undefined): number[];