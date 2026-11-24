/**
 * Internal dependencies
 */
import { postsSource } from './posts';
import type { DataViewsSource } from './types';

// The widget hands a source's rows back to that source alone, so the registry drops the row type.
const SOURCES = new Map< string, DataViewsSource< unknown > >( [
	[ 'jpa/posts', postsSource as unknown as DataViewsSource< unknown > ],
] );

/**
 * The source an instance names in its `source` attribute.
 *
 * @param name - Source name.
 * @return The source, or undefined for a name no source registered under.
 */
export function getDataViewsSource( name?: string ): DataViewsSource< unknown > | undefined {
	return name ? SOURCES.get( name ) : undefined;
}
