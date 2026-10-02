import * as React from 'react';
interface GroupCollectionContext {
  items: readonly any[];
}
declare const GroupCollectionContext: React.Context<GroupCollectionContext | null>;
export declare function useGroupCollectionContext(): GroupCollectionContext | null;
export declare function GroupCollectionProvider(props: GroupCollectionProvider.Props): React.JSX.Element;
declare namespace GroupCollectionProvider {
  interface Props {
    children: React.ReactNode;
    items: readonly any[];
  }
}
export {};