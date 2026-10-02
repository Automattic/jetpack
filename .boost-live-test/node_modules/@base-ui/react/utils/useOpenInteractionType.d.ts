import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
export declare function useOpenMethodTriggerProps(open: boolean | (() => boolean), setOpenMethod: (interactionType: InteractionType | null) => void): {
  onClick: (event: React.MouseEvent | React.PointerEvent) => void;
  onPointerDown: (event: React.PointerEvent) => void;
};
/**
 * Determines the interaction type (keyboard, mouse, touch, etc.) that opened the component.
 *
 * @param open The open state of the component.
 */
export declare function useOpenInteractionType(open: boolean): {
  openMethod: InteractionType | null;
  triggerProps: {
    onClick: (event: React.MouseEvent | React.PointerEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
  };
};