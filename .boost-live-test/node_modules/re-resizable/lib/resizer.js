var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { jsx as _jsx } from "react/jsx-runtime";
import { memo, useCallback, useMemo } from 'react';
var rowSizeBase = {
    width: '100%',
    height: '10px',
    top: '0px',
    left: '0px',
    cursor: 'row-resize',
};
var colSizeBase = {
    width: '10px',
    height: '100%',
    top: '0px',
    left: '0px',
    cursor: 'col-resize',
};
var edgeBase = {
    width: '20px',
    height: '20px',
    position: 'absolute',
    zIndex: 1,
};
var styles = {
    top: __assign(__assign({}, rowSizeBase), { top: '-5px' }),
    right: __assign(__assign({}, colSizeBase), { left: undefined, right: '-5px' }),
    bottom: __assign(__assign({}, rowSizeBase), { top: undefined, bottom: '-5px' }),
    left: __assign(__assign({}, colSizeBase), { left: '-5px' }),
    topRight: __assign(__assign({}, edgeBase), { right: '-10px', top: '-10px', cursor: 'ne-resize' }),
    bottomRight: __assign(__assign({}, edgeBase), { right: '-10px', bottom: '-10px', cursor: 'se-resize' }),
    bottomLeft: __assign(__assign({}, edgeBase), { left: '-10px', bottom: '-10px', cursor: 'sw-resize' }),
    topLeft: __assign(__assign({}, edgeBase), { left: '-10px', top: '-10px', cursor: 'nw-resize' }),
};
export var Resizer = memo(function (props) {
    var onResizeStart = props.onResizeStart, direction = props.direction, children = props.children, replaceStyles = props.replaceStyles, className = props.className;
    var onMouseDown = useCallback(function (e) {
        onResizeStart(e, direction);
    }, [onResizeStart, direction]);
    var onTouchStart = useCallback(function (e) {
        onResizeStart(e, direction);
    }, [onResizeStart, direction]);
    var style = useMemo(function () {
        return __assign(__assign({ position: 'absolute', userSelect: 'none' }, styles[direction]), (replaceStyles !== null && replaceStyles !== void 0 ? replaceStyles : {}));
    }, [replaceStyles, direction]);
    return (_jsx("div", { className: className || undefined, style: style, onMouseDown: onMouseDown, onTouchStart: onTouchStart, children: children }));
});
