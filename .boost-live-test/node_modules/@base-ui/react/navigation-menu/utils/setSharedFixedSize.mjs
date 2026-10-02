import * as NavigationMenuPopupCssVars from "../popup/NavigationMenuPopupCssVars.mjs";
import * as NavigationMenuPositionerCssVars from "../positioner/NavigationMenuPositionerCssVars.mjs";
export function setSharedFixedSize(popupElement, positionerElement, width, height) {
  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupWidth, `${width}px`);
  popupElement.style.setProperty(NavigationMenuPopupCssVars.popupHeight, `${height}px`);
  positionerElement.style.setProperty(NavigationMenuPositionerCssVars.positionerWidth, `${width}px`);
  positionerElement.style.setProperty(NavigationMenuPositionerCssVars.positionerHeight, `${height}px`);
}