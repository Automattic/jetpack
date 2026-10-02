// packages/api-fetch/src/middlewares/fetch-all-middleware.ts
import { addQueryArgs } from "@wordpress/url";
import apiFetch from "../index.mjs";
var modifyQuery = ({ path, url, ...options }, queryArgs) => ({
  ...options,
  url: url && addQueryArgs(url, queryArgs),
  path: path && addQueryArgs(path, queryArgs)
});
var parseResponse = (response) => response.json ? response.json() : Promise.reject(response);
var parseLinkHeader = (linkHeader) => {
  if (!linkHeader) {
    return {};
  }
  const match = linkHeader.match(/<([^>]+)>; rel="next"/);
  return match ? {
    next: match[1]
  } : {};
};
var getNextPageUrl = (response) => {
  const { next } = parseLinkHeader(response.headers.get("link"));
  return next;
};
var requestContainsUnboundedQuery = (options) => {
  const pathIsUnbounded = !!options.path && options.path.indexOf("per_page=-1") !== -1;
  const urlIsUnbounded = !!options.url && options.url.indexOf("per_page=-1") !== -1;
  return pathIsUnbounded || urlIsUnbounded;
};
var fetchAllMiddleware = async (options, next) => {
  if (options.parse === false) {
    return next(options);
  }
  if (!requestContainsUnboundedQuery(options)) {
    return next(options);
  }
  const response = await apiFetch({
    ...modifyQuery(options, {
      per_page: 100
    }),
    // Ensure headers are returned for page 1.
    parse: false
  });
  const results = await parseResponse(response);
  if (!Array.isArray(results)) {
    return results;
  }
  let nextPage = getNextPageUrl(response);
  if (!nextPage) {
    return results;
  }
  let mergedResults = [].concat(results);
  while (nextPage) {
    const nextResponse = await apiFetch({
      ...options,
      // Ensure the URL for the next page is used instead of any provided path.
      path: void 0,
      url: nextPage,
      // Ensure we still get headers so we can identify the next page.
      parse: false
    });
    const nextResults = await parseResponse(nextResponse);
    mergedResults = mergedResults.concat(nextResults);
    nextPage = getNextPageUrl(nextResponse);
  }
  return mergedResults;
};
var fetch_all_middleware_default = fetchAllMiddleware;
export {
  fetch_all_middleware_default as default
};
//# sourceMappingURL=fetch-all-middleware.mjs.map
