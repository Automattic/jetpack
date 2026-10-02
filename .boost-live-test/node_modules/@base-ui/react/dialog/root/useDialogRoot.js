"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogInteractions = DialogInteractions;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useScrollLock = require("@base-ui/utils/useScrollLock");
var _floatingUiReact = require("../../floating-ui-react");
var _utils = require("../../floating-ui-react/utils");
var _popups = require("../../utils/popups");
function DialogInteractions({
  store,
  parentContext,
  isDrawer
}) {
  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const modal = store.useState('modal');
  const popupElement = store.useState('popupElement');
  const floatingRootContext = store.useState('floatingRootContext');
  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const [ownNestedOpenDrawers, setOwnNestedOpenDrawers] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;
  const dismiss = (0, _floatingUiReact.useDismiss)(floatingRootContext, {
    outsidePressEvent() {
      if (store.context.internalBackdropRef.current || store.context.backdropRef.current) {
        return 'intentional';
      }
      // Ensure `aria-hidden` on outside elements is removed immediately
      // on outside press when trapping focus.
      return {
        mouse: modal === 'trap-focus' ? 'sloppy' : 'intentional',
        touch: 'sloppy'
      };
    },
    outsidePress(event) {
      if (!store.context.outsidePressEnabledRef.current) {
        return false;
      }

      // For mouse events, only accept left button (button 0)
      // For touch events, a single touch is equivalent to left button
      if ('button' in event && event.button !== 0) {
        return false;
      }
      if ('touches' in event) {
        // Outside press can be handled on `touchend`, where the lifted point is
        // reported in `changedTouches` and `touches` contains any remaining
        // active points. Treat it as a single-finger tap only when exactly one
        // touch ended and no other fingers are still down.
        if (event.type === 'touchend') {
          if (event.changedTouches.length !== 1 || event.touches.length !== 0) {
            return false;
          }
        } else if (event.touches.length !== 1) {
          return false;
        }
      }
      const target = (0, _utils.getTarget)(event);
      if (isTopmost && !disablePointerDismissal) {
        // Only close if the click occurred on the dialog's owning backdrop.
        // This supports multiple modal dialogs that aren't nested in the React tree:
        // https://github.com/mui/base-ui/issues/1320
        if (modal) {
          const internalBackdrop = store.context.internalBackdropRef.current;
          const backdrop = store.context.backdropRef.current;
          return internalBackdrop || backdrop ? internalBackdrop === target || backdrop === target || (0, _utils.contains)(target, popupElement) && !target?.hasAttribute('data-base-ui-portal') : true;
        }
        return true;
      }
      return false;
    },
    escapeKey: isTopmost
  });
  (0, _useScrollLock.useScrollLock)(open && modal === true, popupElement);

  // Listen for nested open/close events on this store to maintain the counts.
  // A close notification is an open notification with zeroed counts.
  store.useContextCallback('onNestedDialogOpen', (dialogCount, drawerCount) => {
    setOwnNestedOpenDialogs(dialogCount);
    setOwnNestedOpenDrawers(drawerCount);
  });

  // Notify parent of our open/close state using parent callbacks, if any
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (parentContext?.onNestedDialogOpen) {
      if (open) {
        parentContext.onNestedDialogOpen(ownNestedOpenDialogs + 1, ownNestedOpenDrawers + (isDrawer ? 1 : 0));
      } else {
        parentContext.onNestedDialogOpen(0, 0);
      }
    }
    return () => {
      if (parentContext?.onNestedDialogOpen && open) {
        parentContext.onNestedDialogOpen(0, 0);
      }
    };
  }, [isDrawer, open, ownNestedOpenDialogs, ownNestedOpenDrawers, parentContext]);
  (0, _popups.usePopupInteractionProps)(store, {
    // `enabled` is not passed to `useDismiss`, so its props are always defined,
    // and `trigger` is the same object as `reference`.
    activeTriggerProps: dismiss.reference,
    inactiveTriggerProps: dismiss.trigger,
    // DialogPopup and DrawerPopup spread `FOCUSABLE_POPUP_PROPS` directly, so
    // this only needs to carry the dismiss handlers.
    popupProps: dismiss.floating,
    nestedOpenDialogCount: ownNestedOpenDialogs,
    nestedOpenDrawerCount: ownNestedOpenDrawers
  });
  return null;
}