/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { PromptType } from './types';

export const FEATURES: PromptType[] = [ 'seo-title', 'seo-meta-description', 'images-alt-text' ];

export const FEATURE_LABELS = {
	'seo-title': __( 'SEO title', 'jetpack' ),
	'seo-meta-description': __( 'SEO description', 'jetpack' ),
	'images-alt-text': __( 'Alt text for images', 'jetpack' ),
} as const;
