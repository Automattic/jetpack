/**
 * Types for the Guidelines feature.
 */

import type { ReactNode } from 'react';

/**
 * A guideline scope from the `/wp/v2/knowledge/guideline-scopes` registry.
 */
export interface Scope {
	slug: string;
	title: string;
	description: string;
	order: number;
}

/**
 * A resolved guideline row (scope or block), indexed by slug.
 */
export interface GuidelineRow {
	id: number;
	content: string;
}

/**
 * The minimal block-type shape the Guidelines UI reads from the block registry.
 */
export interface ContentBlock {
	name: string;
	title: string;
	icon?: { src?: unknown };
}

/**
 * The collection query used to read guideline rows by slug.
 */
export type GuidelineQuery = {
	slug: string[];
	status: string[];
	per_page: number;
};

/**
 * The raw `wp_knowledge` row shape the guidelines page reads.
 */
export interface KnowledgeRow {
	id: number;
	slug: string;
	content?: { raw?: string };
}

export interface GuidelineAccordionProps {
	title: string;
	description: string;
	children: ReactNode;
}

/**
 * The on-disk import/export JSON shape (unchanged from the singleton era so existing files round-
 * trip).
 */
export interface GuidelineImportData {
	guideline_categories: Record< string, unknown >;
}
