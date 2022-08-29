import { createHistory, HistorySource } from 'svelte-navigator';
import createHashSource from './create-hash-source';

/*
 * The object returned by createHashSource is missing some properties that are typically used by createHistory.
 * However, we do not need those properties for maintaining a hash based routing.
 */
export default createHistory( ( createHashSource() as unknown ) as HistorySource );
