/**
 * External dependencies
 */
import { createContext } from 'react';

/**
 * A hook the route link calls for the search it carries under the href's own params.
 */
export type UseLinkSearch = () => Record< string, unknown >;

const NO_SEARCH: Record< string, unknown > = {};

export const useNoLinkSearch: UseLinkSearch = () => NO_SEARCH;

export const LinkSearchHookContext = createContext< UseLinkSearch >( useNoLinkSearch );
