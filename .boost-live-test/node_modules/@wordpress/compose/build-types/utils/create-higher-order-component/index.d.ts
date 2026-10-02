import type { ComponentType } from 'react';
type GetProps<C> = C extends ComponentType<infer P> ? P : never;
export type WithoutInjectedProps<C, I> = Omit<GetProps<C>, keyof I>;
export type WithInjectedProps<C, I> = ComponentType<WithoutInjectedProps<C, I> & I>;
/**
 * Given a function mapping a component to an enhanced component and modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param mapComponent Function mapping component to enhanced component.
 * @param modifierName Seed name from which to generated display name.
 *
 * @return Component class with generated display name assigned.
 */
export declare function createHigherOrderComponent<TInner extends ComponentType<any>, TOuter extends ComponentType<any>>(mapComponent: (Inner: TInner) => TOuter, modifierName: string): (Inner: TInner) => TOuter;
export {};
//# sourceMappingURL=index.d.ts.map