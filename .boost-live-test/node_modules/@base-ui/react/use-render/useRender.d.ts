import * as React from 'react';
import type { ComponentRenderFn } from "../internals/types.js";
import { HTMLProps } from "../internals/types.js";
import { StateAttributesMapping } from "../internals/getStateAttributesProps.js";
/**
 * Renders a Base UI element.
 *
 * @public
 */
export declare function useRender<State extends Record<string, unknown>, RenderedElementType extends Element, Enabled extends boolean | undefined = undefined>(params: useRender.Parameters<State, RenderedElementType, Enabled>): useRender.ReturnValue<Enabled>;
export type UseRenderRenderProp<State = Record<string, unknown>> = React.ReactElement | ComponentRenderFn<React.HTMLAttributes<any>, State>;
export type UseRenderElementProps<ElementType extends React.ElementType> = React.ComponentPropsWithRef<ElementType>;
export type UseRenderComponentProps<ElementType extends React.ElementType, State = {}, RenderFunctionProps = HTMLProps> = React.ComponentPropsWithRef<ElementType> & {
  /**
   * Allows you to replace the component's HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: React.ReactElement | ComponentRenderFn<RenderFunctionProps, State> | undefined;
};
export interface UseRenderParameters<State, RenderedElementType extends Element, Enabled extends boolean | undefined> {
  /**
   * The React element or a function that returns one to override the default element.
   */
  render?: UseRenderRenderProp<State> | undefined;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | React.Ref<RenderedElementType>[] | undefined;
  /**
   * The state of the component, passed as the second argument to the `render` callback.
   * State properties are automatically converted to data-* attributes.
   */
  state?: State | undefined;
  /**
   * Custom mapping for converting state properties to data-* attributes.
   * @example
   * { isActive: (value) => (value ? { 'data-is-active': '' } : null) }
   */
  stateAttributesMapping?: StateAttributesMapping<State> | undefined;
  /**
   * Props to be spread on the rendered element.
   * They are merged with the internal props of the component, so that event handlers
   * are merged, `className` strings and `style` properties are joined, while other external props overwrite the
   * internal ones.
   */
  props?: Record<string, unknown> | undefined;
  /**
   * If `false`, the hook will skip most of its internal logic and return `null`.
   * This is useful for rendering a component conditionally.
   * @default true
   */
  enabled?: Enabled | undefined;
  /**
   * The default tag name to use for the rendered element when `render` is not provided.
   * @default 'div'
   */
  defaultTagName?: keyof React.JSX.IntrinsicElements | undefined;
}
export type UseRenderReturnValue<Enabled extends boolean | undefined> = Enabled extends false ? null : React.ReactElement;
export interface UseRenderState {}
export declare namespace useRender {
  type State = UseRenderState;
  type RenderProp<TState = Record<string, unknown>> = UseRenderRenderProp<TState>;
  type ElementProps<ElementType extends React.ElementType> = UseRenderElementProps<ElementType>;
  type ComponentProps<ElementType extends React.ElementType, TState = {}, RenderFunctionProps = HTMLProps> = UseRenderComponentProps<ElementType, TState, RenderFunctionProps>;
  type Parameters<TState, RenderedElementType extends Element, Enabled extends boolean | undefined> = UseRenderParameters<TState, RenderedElementType, Enabled>;
  type ReturnValue<Enabled extends boolean | undefined> = UseRenderReturnValue<Enabled>;
}