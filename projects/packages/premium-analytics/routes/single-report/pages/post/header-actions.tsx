/**
 * External dependencies
 */
import { getPostTypeCopy } from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { entityHeaderActions } from '../entity/header-actions';
import type { PostSummary } from './use-post-summary';
import type { ReactNode } from 'react';

/**
 * The View post action: the entity's View action, named for the post type.
 *
 * @param summary - The post summary.
 * @return The action, or nothing without a URL.
 */
export function postHeaderActions( summary: PostSummary ): ReactNode {
	return entityHeaderActions( summary, getPostTypeCopy( summary.type ).view );
}
