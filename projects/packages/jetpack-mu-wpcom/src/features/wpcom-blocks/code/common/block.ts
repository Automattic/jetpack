import type { RichTextData } from '@wordpress/rich-text';
export const BLOCK_NAME = 'core/code';

export interface Attributes {
	/** The code string */
	content: RichTextData;

	/**
	 * An array of lines and spans of text.
	 * @todo name the tuple parts.
	 */
	tokenizedLines: ReadonlyArray<
		ReadonlyArray< [ base64html: string, className: string ] | [ base64html: string ] >
	>;

	/** Always a string. Empty string "" indicates no language. */
	language: string;
	languageConfidence: 'certain' | 'tentative' | 'unknown';

	/**
	 * This is used from the file transform to inject the text from the file.
	 * It is necessary mainly because file read operations are async, while block transforms
	 * are not.
	 */
	triggerCodeUpdate: boolean;

	showCopyButton: boolean;

	showLanguageName: boolean;

	showLineNumbers: boolean;
	lineNumbersStartAt: number;
	filename: string;

	style?: {
		border?: {
			radius?: string;
			width?: string;
			color?: string;
		};
		color?: {
			/**
			 * Arbitrary background colors.
			 * Known preset colors will be at `backgroundColor`.
			 */
			background?: string;
			/**
			 * Arbitrary background colors.
			 * Known preset colors will be at `textColor`.
			 */
			text?: string;
		};
		spacing?: {
			margin?: {
				top?: string;
				right?: string;
				bottom?: string;
				left?: string;
			};
			padding?: {
				top?: string;
				right?: string;
				bottom?: string;
				left?: string;
			};
		};
		shadow?: string;
	};

	/**
	 * If the color is a known preset color, it will be here.
	 * Arbitrary colors will be at `style.color.background`.
	 */
	backgroundColor?: string | undefined;
	/**
	 * If the color is a known preset color, it will be here.
	 * Arbitrary colors will be at `style.color.text`.
	 */
	textColor?: string | undefined;

	colorComment?: string | undefined;
	colorKeyword?: string | undefined;
	colorBoolean?: string | undefined;
	colorLiteral?: string | undefined;
	colorString?: string | undefined;
	colorSpecialString?: string | undefined;
	colorMacroName?: string | undefined;
	colorVariableDefinition?: string | undefined;
	colorTypeName?: string | undefined;
	colorClassName?: string | undefined;
	colorInvalid?: string | undefined;
}

export interface SaveBlockProps {
	attributes: Attributes;

	isSelected: undefined;
	clientId: undefined;
	name: undefined;
	setAttributes: undefined;

	insertBlocksAfter: undefined;
	mergeBlocks: undefined;
	onRemove: undefined;
	onReplace: undefined;
	toggleSelection: undefined;
}

export interface EditBlockProps {
	attributes: Attributes;
	clientId: string;
	name: string;
	setAttributes: (
		nextAtts: Partial< Attributes >
		// Callback only WP 6.9+???
		// | ((prevAtts: Attributes) => Partial<Attributes>)
	) => void;
	isSelected: boolean;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	insertBlocksAfter: ( blocks: any ) => void;

	mergeBlocks: ( firstBlockClientId: string, secondBlockClientId: string ) => void;
	onRemove: () => void;
	onReplace: () => void;
	toggleSelection: () => void;
}
