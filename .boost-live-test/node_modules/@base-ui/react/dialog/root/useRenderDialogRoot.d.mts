import * as React from 'react';
import type { DialogRootProps } from "./DialogRoot.mjs";
export declare function useRenderDialogRoot<Payload>(mode: DialogRootMode, props: DialogRootProps<Payload>): React.JSX.Element;
type DialogRootMode = 'dialog' | 'drawer' | 'alert-dialog';
export {};