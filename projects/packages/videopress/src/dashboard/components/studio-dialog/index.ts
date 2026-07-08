// Side-effect import: injects the content-area centering rules for both
// dialog systems (the `@wordpress/ui` popups below and the DataViews-owned
// `.dataviews-action-modal` overlays) via wp-build's inline-style pipeline.
import './style.scss';

/**
 * Class name that re-centers a `@wordpress/ui` `Dialog.Popup` within the
 * wp-admin content area (viewport minus admin menu and admin bar) instead of
 * the raw viewport, which reads as off-center next to wp-admin's chrome.
 *
 * Pass it as `className` on every Studio-owned `Dialog.Popup`. DataViews
 * action modals need no class — the stylesheet targets their stable
 * `.dataviews-action-modal` overlay directly — but modules that only render
 * DataViews `RenderModal` bodies must import this module for its stylesheet
 * side effect so the rules travel with their route chunk.
 *
 * The positioning rules live in ./style.scss and key off this class.
 */
export const STUDIO_DIALOG_CLASS = 'videopress-studio-dialog';
