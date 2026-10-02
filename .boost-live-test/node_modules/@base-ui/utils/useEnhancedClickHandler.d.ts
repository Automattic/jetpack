import * as React from 'react';
export type InteractionType = 'mouse' | 'touch' | 'pen' | 'keyboard' | '';
/**
 * Provides a cross-browser way to determine the type of the pointer used to click.
 * Safari and Firefox do not provide the PointerEvent to the click handler (they use MouseEvent) yet.
 * Additionally, this implementation detects if the click was triggered by the keyboard.
 *
 * @param handler The function to be called when the button is clicked. The first parameter is the original event and the second parameter is the pointer type.
 */
export declare function useEnhancedClickHandler(handler: (event: React.MouseEvent | React.PointerEvent, interactionType: InteractionType) => void): {
  onClick: (event: React.MouseEvent | React.PointerEvent) => void;
  onPointerDown: (event: React.PointerEvent) => void;
};