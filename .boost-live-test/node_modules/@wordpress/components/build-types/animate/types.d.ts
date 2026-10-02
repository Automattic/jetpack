export type AppearOptions = {
    type: 'appear';
    origin?: 'top' | 'top left' | 'top right' | 'middle' | 'middle left' | 'middle right' | 'bottom' | 'bottom left' | 'bottom right';
};
type SlideInOptions = {
    type: 'slide-in';
    origin?: 'left' | 'right';
};
type LoadingOptions = {
    type: 'loading';
    origin?: never;
};
type NoAnimationOptions = {
    type?: never;
    origin?: never;
};
export type GetAnimateOptions = AppearOptions | SlideInOptions | LoadingOptions | NoAnimationOptions;
type DistributiveTypeAndOptions<T extends {
    type?: any;
}> = T extends any ? Pick<T, 'type'> & {
    options?: Omit<T, 'type'>;
} : never;
export type AnimateProps = DistributiveTypeAndOptions<GetAnimateOptions> & {
    children: (props: {
        className?: string;
    }) => React.JSX.Element;
};
export {};
//# sourceMappingURL=types.d.ts.map