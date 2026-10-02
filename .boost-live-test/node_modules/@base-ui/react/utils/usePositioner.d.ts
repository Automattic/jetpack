import { type UseRenderElementComponentProps } from "../internals/useRenderElement.js";
import type { TransitionStatus } from "../internals/useTransitionStatus.js";
interface UsePositionerOptions {
  styles: React.CSSProperties;
  transitionStatus: TransitionStatus;
  props?: React.ComponentProps<'div'> | undefined;
  refs?: React.Ref<HTMLDivElement> | (React.Ref<HTMLDivElement> | undefined)[] | undefined;
  hidden?: boolean | undefined;
  inert?: boolean | undefined;
}
/**
 * Renders the shared outer Positioner element used by popup components.
 * Applies the common role, hidden state, transition styles, state attributes, and optional inert styling.
 */
export declare function usePositioner<State extends Record<string, any>>(componentProps: UseRenderElementComponentProps<State>, state: State, {
  styles,
  transitionStatus,
  props,
  refs,
  hidden,
  inert
}: UsePositionerOptions): import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
export {};