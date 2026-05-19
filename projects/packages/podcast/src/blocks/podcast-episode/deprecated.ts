/**
 * Block deprecations for jetpack/podcast-episode.
 *
 * v1 stored chapters as an inline `chapters: array` attribute. v2 swapped that
 * for a hosted chapters file referenced by `chaptersUrl` + `chaptersType`.
 * Without this stub Gutenberg flags any pre-existing block with the dropped
 * attribute as "block contains unexpected content".
 */

import metadata from './block.json';
import save from './save';

interface LegacyChapter {
	startTime?: number;
	title?: string;
}

interface V1Attributes {
	mediaUrl?: string;
	chapters?: LegacyChapter[];
	[ key: string ]: unknown;
}

const v1 = {
	attributes: {
		...metadata.attributes,
		chapters: {
			type: 'array',
			default: [],
		},
	},
	save,
	migrate( attributes: V1Attributes ) {
		const next = { ...attributes };
		delete next.chapters;
		return next;
	},
};

export default [ v1 ];
