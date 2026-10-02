import * as React from 'react';
export type MenuGroupContext = React.Dispatch<React.SetStateAction<string | undefined>>;
export declare const MenuGroupContext: React.Context<MenuGroupContext | undefined>;
export declare function useMenuGroupRootContext(): MenuGroupContext;