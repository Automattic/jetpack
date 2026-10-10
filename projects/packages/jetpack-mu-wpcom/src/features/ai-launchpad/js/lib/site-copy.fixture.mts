import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SiteCopy } from './types.ts';

/**
 * The English `site.copy` the REST read serves. The PHP suite asserts
 * `wpcom_ai_launchpad_site_copy()` against the same file, so a wording change fails there first.
 */
export const ENGLISH_SITE_COPY: SiteCopy = JSON.parse(
	readFileSync(
		resolve(
			dirname( fileURLToPath( import.meta.url ) ),
			'../../../../../tests/php/features/ai-launchpad/fixtures/site-copy.json'
		),
		'utf8'
	)
);
