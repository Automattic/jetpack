import type { JSXElementConstructor } from 'react';
import type React from 'react';

export {};

declare module 'react' {
	interface CSSProperties {
		[ customProperty: `--${ string }` ]: string | undefined;
	}
}

interface Store {}

declare global {
	interface Uint8ArrayConstructor {
		fromBase64?: ( base64: string ) => Uint8Array;
	}
	interface Uint8Array {
		toBase64?: ( this: Uint8Array ) => string;
	}

	interface Window {
		React: typeof React;

		wp: {
			blockEditor: {
				InspectorControls: JSXElementConstructor< any >;
				BlockControls: JSXElementConstructor< any >;
				PlainText: JSXElementConstructor< any >;
				store: Store;
				useBlockProps: any;
				withColors: (
					...colors: ReadonlyArray< string >
				) => < Props >(
					Component: JSXElementConstructor< Props >
				) => JSXElementConstructor< Props >;
				__experimentalGetElementClassName?: ( element: 'button' ) => 'wp-element-button';
				__experimentalGetElementClassName?: ( element: 'caption' ) => 'wp-element-caption';
				__experimentalUseMultipleOriginColorsAndGradients: () => {
					colors: ReadonlyArray< {
						readonly name: string;
						readonly slug: string;
						readonly colors: ReadonlyArray< {
							readonly color: string;
							readonly name: string;
							readonly slug: string;
						} >;
					} >;
					readonly gradients: ReadonlyArray< unknown >;
					readonly disableCustomColors: boolean;
					readonly disableCustomGradients: boolean;
					readonly hasColorsOrGradients: boolean;
				};

				__experimentalColorGradientSettingsDropdown: JSXElementConstructor< {
					disableCustomColors?: boolean;
					disableCustomGradients?: boolean;
					enableAlpha?: boolean;
					gradients: ReadonlyArray< unknown >;
					colors: ReadonlyArray< {
						readonly name: string;
						readonly slug: string;
						readonly colors: ReadonlyArray< {
							readonly color: string;
							readonly name: string;
							readonly slug: string;
						} >;
					} >;
					__experimentalIsRenderedInSidebar: boolean;
					panelId: string;
					isShownByDefault?: boolean;
					settings: ReadonlyArray< {
						readonly resetAllFilter?: () => void;
						readonly clearable?: boolean;
						readonly label: string;
						readonly colorValue: string | undefined;
						readonly onColorChange: ( value: string ) => void;
					} >;
				} >;
			};
			blocks: typeof import('@wordpress/blocks');
			data: {
				dispatch: ( store: Store ) => any;
				useDispatch: ( store: Store ) => any;
				useSelect: (
					selectOrStore: Store | ( ( select: ( Store ) => any ) => any ),
					dependencies?: unknown[]
				) => any;
			};
			i18n: typeof import('@wordpress/i18n');
			keycodes: typeof import('@wordpress/keycodes');
			richText: typeof import('@wordpress/rich-text');
		};
	}
}
