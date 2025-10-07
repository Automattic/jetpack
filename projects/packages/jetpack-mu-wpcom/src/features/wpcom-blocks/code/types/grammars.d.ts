declare module '*.grammar' {
	import type { LRLanguage } from '@codemirror/language';
	export const parser: LRLanguage[ 'parser' ];
}
