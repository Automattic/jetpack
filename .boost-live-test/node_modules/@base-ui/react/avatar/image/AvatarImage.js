"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AvatarImage = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRenderElement = require("../../internals/useRenderElement");
var _AvatarRootContext = require("../root/AvatarRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _stateAttributesMapping2 = require("../../internals/stateAttributesMapping");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _useImageLoadingStatus = require("./useImageLoadingStatus");
const stateAttributesMapping = {
  ..._stateAttributesMapping.avatarStateAttributesMapping,
  ..._stateAttributesMapping2.transitionStatusMapping
};

/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarImage = exports.AvatarImage = /*#__PURE__*/React.forwardRef(function AvatarImage(componentProps, forwardedRef) {
  const {
    className,
    render,
    onLoadingStatusChange: onLoadingStatusChangeProp,
    keepMounted = false,
    style,
    // Split out so they can be applied after every other prop. React 17 and 18 set attributes in
    // props order, and Safari and Firefox start fetching as soon as `src` lands, ignoring a
    // `loading` or `srcSet` that arrives after it. React 19 orders these itself.
    sizes,
    srcSet,
    src,
    ...elementProps
  } = componentProps;
  const {
    setImageLoadingStatus: setRootImageLoadingStatus
  } = (0, _AvatarRootContext.useAvatarRootContext)();
  const [imageLoadingStatus, setImageLoadingStatus] = (0, _useImageLoadingStatus.useImageLoadingStatus)(src, componentProps, !keepMounted);
  const isVisible = imageLoadingStatus === 'loaded';
  const {
    mounted,
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(isVisible);
  const imageRef = React.useRef(null);
  const initialCommitRef = React.useRef(true);

  // With `keepMounted`, the status comes from the rendered element itself, whose `load` event may
  // have already fired (cached images, or loads completed before hydration).
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!keepMounted) {
      return;
    }
    const isInitialCommit = initialCommitRef.current;
    initialCommitRef.current = false;
    const image = imageRef.current;
    if (!image) {
      // The `render` element didn't forward the ref. Its own `load`/`error` events remain the
      // only source of truth, so don't overwrite the status they already reported.
      return;
    }
    if (!image.complete) {
      setImageLoadingStatus('loading');
      return;
    }
    const status = image.naturalWidth > 0 ? 'loaded' : 'error';
    setImageLoadingStatus(status);

    // An image that's already complete on the first commit was painted before hydration, so
    // mount it without going through `'starting'` to avoid replaying the enter animation.
    if (status === 'loaded' && isInitialCommit) {
      setMounted(true);
    }
  }, [keepMounted, src, srcSet, sizes, elementProps.crossOrigin, elementProps.referrerPolicy, render, setImageLoadingStatus, setMounted]);
  const renderedStatusProps = keepMounted ? {
    // Presence no longer implies the image loaded, so the not-loaded states need their own
    // styling hooks. Scoped to `keepMounted` so the default mode, where the element only
    // exists once loaded, doesn't pick them up while it animates out.
    'data-loading': imageLoadingStatus === 'loading' ? '' : undefined,
    'data-error': imageLoadingStatus === 'error' ? '' : undefined,
    // Until the image is displayable, the fallback owns the accessible name; without this
    // both would be exposed to assistive technology at once (including in server HTML).
    'aria-hidden': imageLoadingStatus !== 'loaded' || undefined,
    onLoad() {
      setImageLoadingStatus('loaded');
    },
    onError() {
      setImageLoadingStatus('error');
    }
  } : undefined;
  const handleLoadingStatusChange = (0, _useStableCallback.useStableCallback)(status => {
    onLoadingStatusChangeProp?.(status);
    setRootImageLoadingStatus(status);
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus);
    }
  }, [imageLoadingStatus, handleLoadingStatusChange]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    return () => setRootImageLoadingStatus('idle');
  }, [setRootImageLoadingStatus]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    enabled: !isVisible,
    open: isVisible,
    ref: imageRef,
    onComplete() {
      if (!isVisible) {
        setMounted(false);
      }
    }
  });
  const state = {
    imageLoadingStatus,
    // The element never unmounts with `keepMounted`, so an exit transition would play and then
    // reverse itself once the status is cleared. `data-loading`/`data-error` cover that state.
    transitionStatus: keepMounted && transitionStatus === 'ending' ? undefined : transitionStatus
  };
  const shouldRender = keepMounted || mounted;
  const sourceProps = {};
  if (sizes !== undefined) {
    sourceProps.sizes = sizes;
  }
  if (srcSet !== undefined) {
    sourceProps.srcSet = srcSet;
  }
  if (src !== undefined) {
    sourceProps.src = src;
  }
  const element = (0, _useRenderElement.useRenderElement)('img', componentProps, {
    state,
    ref: [forwardedRef, imageRef],
    props: [renderedStatusProps, elementProps, sourceProps],
    stateAttributesMapping,
    enabled: shouldRender
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") AvatarImage.displayName = "AvatarImage";