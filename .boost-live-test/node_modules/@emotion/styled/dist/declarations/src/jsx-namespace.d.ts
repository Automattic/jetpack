import 'react';
type IsPreReact19 = 2 extends Parameters<React.FunctionComponent<any>>['length'] ? true : false;
/** @ts-ignore */
export type ReactJSXIntrinsicElements = true extends IsPreReact19 ? JSX.IntrinsicElements : React.JSX.IntrinsicElements;
export {};
