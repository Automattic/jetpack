import * as React from 'react';
import type { ImageLoadingStatus } from "./AvatarRoot.js";
export interface AvatarRootContext {
  imageLoadingStatus: ImageLoadingStatus;
  setImageLoadingStatus: React.Dispatch<React.SetStateAction<ImageLoadingStatus>>;
}
export declare const AvatarRootContext: React.Context<AvatarRootContext | undefined>;
export declare function useAvatarRootContext(): AvatarRootContext;