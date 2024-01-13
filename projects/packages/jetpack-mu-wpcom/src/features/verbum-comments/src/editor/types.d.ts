declare module '*.scss?inline' {
	const classes: { [ key: string ]: string };
	export default classes;
}

declare module '@wordpress/format-library/build/default-formats' {
	import { type NamedFormatConfiguration } from '@wordpress/rich-text';

	const formats: NamedFormatConfiguration[];

	export default formats;
}

declare module '@verbum/block-editor' {
	export function addGutenberg(
		textarea: HTMLTextAreaElement,
		setComment: ( newValue: string ) => void
	): void;
}

declare module '@wordpress/block-library/build-module/*' {
	import { BlockConfiguration } from '@wordpress/blocks';

	const block: Block;

	export = block;
}
