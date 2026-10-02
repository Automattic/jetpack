import type { APIFetchMiddleware } from '../types';
/**
 * The REST API enforces an upper limit on the per_page option. To handle large
 * collections, apiFetch consumers can pass `per_page=-1`; this middleware will
 * then recursively assemble a full response array from all available pages.
 * @param options
 * @param next
 */
declare const fetchAllMiddleware: APIFetchMiddleware;
export default fetchAllMiddleware;
//# sourceMappingURL=fetch-all-middleware.d.ts.map