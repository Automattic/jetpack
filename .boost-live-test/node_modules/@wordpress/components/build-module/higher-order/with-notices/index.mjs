// packages/components/src/higher-order/with-notices/index.tsx
import { v4 as uuid } from "uuid";
import { forwardRef, useState, useMemo } from "@wordpress/element";
import { createHigherOrderComponent } from "@wordpress/compose";
import NoticeList from "../../notice/list.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var with_notices_default = createHigherOrderComponent((OriginalComponent) => {
  function Component(props, ref) {
    const [noticeList, setNoticeList] = useState([]);
    const noticeOperations = useMemo(() => {
      const createNotice = (notice) => {
        const noticeToAdd = notice.id ? notice : {
          ...notice,
          id: uuid()
        };
        setNoticeList((current) => [...current, noticeToAdd]);
      };
      return {
        createNotice,
        createErrorNotice: (msg) => {
          createNotice({
            status: "error",
            content: msg
          });
        },
        removeNotice: (id) => {
          setNoticeList((current) => current.filter((notice) => notice.id !== id));
        },
        removeAllNotices: () => {
          setNoticeList([]);
        }
      };
    }, []);
    const propsOut = {
      ...props,
      noticeList,
      noticeOperations,
      noticeUI: noticeList.length > 0 && /* @__PURE__ */ _jsx(NoticeList, {
        className: "components-with-notices-ui",
        notices: noticeList,
        onRemove: noticeOperations.removeNotice
      })
    };
    return isForwardRef ? /* @__PURE__ */ _jsx(OriginalComponent, {
      ...propsOut,
      ref
    }) : /* @__PURE__ */ _jsx(OriginalComponent, {
      ...propsOut
    });
  }
  let isForwardRef;
  const {
    render
  } = OriginalComponent;
  if (typeof render === "function") {
    isForwardRef = true;
    return forwardRef(Component);
  }
  return Component;
}, "withNotices");
export {
  with_notices_default as default
};
//# sourceMappingURL=index.mjs.map
