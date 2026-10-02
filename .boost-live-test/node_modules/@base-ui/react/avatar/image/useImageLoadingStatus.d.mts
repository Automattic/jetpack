import * as React from 'react';
import type { ImageLoadingStatus } from "../root/AvatarRoot.mjs";
interface UseImageLoadingStatusOptions {
  referrerPolicy?: React.HTMLAttributeReferrerPolicy | undefined;
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin'] | undefined;
  sizes?: React.ImgHTMLAttributes<HTMLImageElement>['sizes'] | undefined;
  srcSet?: React.ImgHTMLAttributes<HTMLImageElement>['srcSet'] | undefined;
}
export declare function useImageLoadingStatus(src: string | undefined, {
  referrerPolicy,
  crossOrigin,
  sizes,
  srcSet
}: UseImageLoadingStatusOptions, enabled: boolean): [ImageLoadingStatus, React.Dispatch<React.SetStateAction<ImageLoadingStatus>>];
export {};