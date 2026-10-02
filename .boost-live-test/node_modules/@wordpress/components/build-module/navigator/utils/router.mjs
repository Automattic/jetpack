// packages/components/src/navigator/utils/router.ts
import { match } from "path-to-regexp";
function matchPath(path, pattern) {
  const matchingFunction = match(pattern, {
    decode: decodeURIComponent
  });
  return matchingFunction(path);
}
function patternMatch(path, screens) {
  for (const screen of screens) {
    const matched = matchPath(path, screen.path);
    if (matched) {
      return {
        params: matched.params,
        id: screen.id
      };
    }
  }
  return void 0;
}
function findParent(path, screens) {
  if (!path.startsWith("/")) {
    return void 0;
  }
  const pathParts = path.split("/");
  let parentPath;
  while (pathParts.length > 1 && parentPath === void 0) {
    pathParts.pop();
    const potentialParentPath = pathParts.join("/") === "" ? "/" : pathParts.join("/");
    if (screens.find((screen) => {
      return matchPath(potentialParentPath, screen.path) !== false;
    })) {
      parentPath = potentialParentPath;
    }
  }
  return parentPath;
}
export {
  findParent,
  patternMatch
};
//# sourceMappingURL=router.mjs.map
