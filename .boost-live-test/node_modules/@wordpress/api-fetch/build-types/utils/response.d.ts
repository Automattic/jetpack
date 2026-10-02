/**
 * Parses the apiFetch response properly and normalize response errors.
 *
 * @param response
 * @param shouldParseResponse
 *
 * @return Parsed response.
 */
export declare function parseResponseAndNormalizeError(response: Response, shouldParseResponse?: boolean): Promise<any>;
/**
 * Parses a response, throwing an error if parsing the response fails.
 *
 * @param response
 * @param shouldParseResponse
 * @return Never returns, always throws.
 */
export declare function parseAndThrowError(response: Response, shouldParseResponse?: boolean): Promise<void>;
//# sourceMappingURL=response.d.ts.map