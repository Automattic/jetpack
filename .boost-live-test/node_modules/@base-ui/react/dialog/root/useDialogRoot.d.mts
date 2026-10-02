import { DialogStore } from "../store/DialogStore.mjs";
export declare function DialogInteractions({
  store,
  parentContext,
  isDrawer
}: {
  store: DialogStore<any>;
  parentContext: DialogStore<unknown>['context'] | undefined;
  isDrawer: boolean;
}): null;