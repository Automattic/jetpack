/**
 * Higher Order Component used to be used to wrap disposable elements like
 * sidebars, modals, dropdowns. When mounting the wrapped component, we track a
 * reference to the current active element so we know where to restore focus
 * when the component is unmounted.
 *
 * @param options The component to be enhanced with
 *                focus return behavior, or an object
 *                describing the component and the
 *                focus return characteristics.
 *
 * @return Higher Order Component with the focus restoration behaviour.
 */
declare const _default: (Inner: import("react").ComponentType<any>) => import("react").ComponentType<any>;
export default _default;
export declare const Provider: ({ children }: {
    children: React.ReactNode;
}) => import("react").ReactNode;
//# sourceMappingURL=index.d.ts.map