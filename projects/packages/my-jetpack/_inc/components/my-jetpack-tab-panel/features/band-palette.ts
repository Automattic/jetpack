import type { CSSProperties } from 'react';

const YELLOW = '#f3e4bf';
const PERIWINKLE = '#d0d8f2';
const MINT = '#e3f0e0';
const PEACH = '#f5dccb';
const LILAC = '#e4daf2';
const SKY = '#d3e7f1';

// Colors, then the center of each color's glow as x/y percentages of the band.
type Palette = [ string, string, string, number, number, number, number, number, number ];

// Neighbors in the grid differ, so stepping between them visibly morphs.
const PALETTES: Record< string, Palette > = {
	'activity-log': [ YELLOW, PERIWINKLE, MINT, 24, 22, 66, 26, 70, 92 ],
	'anti-spam': [ PEACH, LILAC, MINT, 30, 30, 72, 18, 58, 96 ],
	blaze: [ YELLOW, PEACH, LILAC, 22, 26, 62, 30, 80, 88 ],
	boost: [ SKY, MINT, YELLOW, 28, 20, 70, 34, 60, 90 ],
	'jetpack-forms': [ MINT, PERIWINKLE, YELLOW, 26, 30, 64, 20, 74, 94 ],
	'jetpack-ai': [ LILAC, PERIWINKLE, PEACH, 30, 18, 70, 30, 66, 92 ],
	crm: [ PEACH, MINT, SKY, 24, 26, 66, 24, 72, 90 ],
	newsletter: [ SKY, LILAC, MINT, 30, 24, 72, 32, 60, 94 ],
	podcast: [ PEACH, YELLOW, PERIWINKLE, 22, 22, 64, 26, 76, 90 ],
	protect: [ MINT, SKY, YELLOW, 28, 28, 70, 20, 62, 96 ],
	search: [ PERIWINKLE, SKY, MINT, 26, 20, 66, 30, 70, 92 ],
	social: [ LILAC, PEACH, SKY, 30, 26, 72, 22, 64, 90 ],
	stats: [ MINT, YELLOW, PERIWINKLE, 24, 30, 64, 24, 74, 94 ],
	backup: [ SKY, PERIWINKLE, MINT, 28, 22, 70, 30, 60, 90 ],
	videopress: [ PEACH, PERIWINKLE, YELLOW, 22, 26, 66, 20, 72, 96 ],
};

const DEFAULT: Palette = [ YELLOW, PERIWINKLE, MINT, 24, 22, 66, 26, 70, 92 ];

/**
 * The custom properties that paint a feature's band.
 *
 * @param slug - The feature's slug.
 * @return Inline style setting the band's colors and glow positions.
 */
export function getBandStyle( slug: string ): CSSProperties {
	const [ a, b, c, ax, ay, bx, by, cx, cy ] = PALETTES[ slug ] ?? DEFAULT;

	return {
		'--band-a': a,
		'--band-b': b,
		'--band-c': c,
		'--band-ax': `${ ax }%`,
		'--band-ay': `${ ay }%`,
		'--band-bx': `${ bx }%`,
		'--band-by': `${ by }%`,
		'--band-cx': `${ cx }%`,
		'--band-cy': `${ cy }%`,
	} as CSSProperties;
}
