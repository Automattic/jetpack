import * as React from 'react';
import { PreviewCardStore } from "../store/PreviewCardStore.js";
export type PreviewCardRootContext<Payload = unknown> = PreviewCardStore<Payload>;
export declare const PreviewCardRootContext: React.Context<PreviewCardRootContext<unknown> | undefined>;
export declare function usePreviewCardRootContext(optional?: false): PreviewCardRootContext;
export declare function usePreviewCardRootContext(optional: true): PreviewCardRootContext | undefined;