import type { JSXElementConstructor } from 'react';
import type React from 'react';

export {};

declare module 'react' {
	interface CSSProperties {
		[customProperty: `--${string}`]: string | undefined;
	}
}

// Use the type system to enforce correct text domain in localization functions.
type TextDomain = 'jetpack-mu-wpcom';

// biome-ignore lint/suspicious/noEmptyInterface: Just a named type to work with.
interface Store {}

declare global {
	interface Uint8ArrayConstructor {
		fromBase64?: (base64: string) => Uint8Array;
	}
	interface Uint8Array {
		toBase64?: (this: Uint8Array) => string;
	}

	interface Window {
		React: typeof React;

		wp: {
			blockEditor: {
				InspectorControls: JSXElementConstructor<any>;
				store: Store;
				useBlockProps: any;
				withColors: (
					...colors: ReadonlyArray<string>
				) => <Props>(
					Component: JSXElementConstructor<Props>,
				) => JSXElementConstructor<Props>;
				__experimentalGetElementClassName: (
					element: 'button',
				) => 'wp-element-button';
				__experimentalGetElementClassName: (
					element: 'caption',
				) => 'wp-element-caption';
				__experimentalUseMultipleOriginColorsAndGradients: () => {
					colors: ReadonlyArray<{
						readonly name: string;
						readonly slug: string;
						readonly colors: ReadonlyArray<{
							readonly color: string;
							readonly name: string;
							readonly slug: string;
						}>;
					}>;
					readonly gradients: ReadonlyArray<unknown>;
					readonly disableCustomColors: boolean;
					readonly disableCustomGradients: boolean;
					readonly hasColorsOrGradients: boolean;
				};

				__experimentalColorGradientSettingsDropdown: JSXElementConstructor<{
					disableCustomColors?: boolean;
					disableCustomGradients?: boolean;
					enableAlpha?: boolean;
					gradients: ReadonlyArray<unknown>;
					colors: ReadonlyArray<{
						readonly name: string;
						readonly slug: string;
						readonly colors: ReadonlyArray<{
							readonly color: string;
							readonly name: string;
							readonly slug: string;
						}>;
					}>;
					__experimentalIsRenderedInSidebar: boolean;
					panelId: string;
					isShownByDefault?: boolean;
					settings: ReadonlyArray<{
						readonly resetAllFilter?: () => void;
						readonly clearable?: boolean;
						readonly label: string;
						readonly colorValue: string | undefined;
						readonly onColorChange: (value: string) => void;
					}>;
				}>;
			};
			blocks: {
				__unstableSerializeAndClean: (blocks: object[]) => object[];

				createBlock: <Attributes>(
					blockName: string,
					attributes?: Partial<Attributes>,
				) => { clientId: string };
				registerBlockStyle: (
					blockName: string,
					styleConfig: {
						name: string;
						label: string;
						/* Discourage this from being used */
						isDefault?: never;
					},
				) => void;
				registerBlockType: (
					blockName: object | string,
					settings: object,
				) => void;
				getDefaultBlockName: () => string;

				/**
				 * Given a block type containing a save render implementation and attributes, returns the enhanced element to be saved or string when raw HTML expected.
				 *
				 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/#getsaveelement
				 */
				getSaveElement: (
					/** Block type or name. */
					blockTypeOrName: string | object,
					/** Block attributes. */
					attributes: object,
					/** Nested blocks. */
					innerBlocks?: Array,
				) => React.JSX.Element | null;
			};
			components: {
				Button: JSXElementConstructor<any>;
				CustomSelectControl: JSXElementConstructor<any>;
				ExternalLink: JSXElementConstructor<{
					children: React.ReactNode;
					href: string;
				}>;
				Notice: JSXElementConstructor<
					React.PropsWithChildren<{
						status?: 'info' | 'warning' | 'success' | 'error';
						isDismissible?: boolean;
					}>
				>;
				PanelBody: JSXElementConstructor<any>;
				SelectControl: JSXElementConstructor<any>;
				TextControl: JSXElementConstructor<any>;
				ToggleControl: JSXElementConstructor<any>;
				VisuallyHidden: JSXElementConstructor<any>;
			};
			compose: {
				useInstanceId: (object: object) => number;
				useInstanceId: (object: object, prefix: string) => string;
				useInstanceId: <T extends string | number>(
					object: object,
					prefix: string,
					preferredId?: T,
				) => T;
			};
			coreData: {
				store: Store;
			};
			data: {
				dispatch: (store: Store) => any;
				useDispatch: (store: Store) => any;
				useSelect: (
					selectOrStore: Store | ((select: (Store) => any) => any),
					dependencies?: unknown[],
				) => any;
			};
			editor: {
				PostTitleRaw: JSXElementConstructor<{ ref: React.RefObject<any> }>;
				privateApis: PrivateApis<{
					EditorContentSlotFill: {
						name: string | symbol;
						Fill: {
							(props: any): React.JSX.Element;
							displayName: string;
						};
						Slot: {
							(props: any): React.JSX.Element;
							displayName: string;
						};
					};
				}>;
				store: Store;
			};
			i18n: {
				__: (text: string, domain: TextDomain) => string;
				_x: (text: string, context: string, domain: TextDomain) => string;
				_n: (
					single: string,
					plural: string,
					number: number,
					domain: TextDomain,
				) => string;
				_nx: (
					single: string,
					plural: string,
					number: number,
					context: string,
					domain: TextDomain,
				) => string;
			};
			keycodes: {
				isKeyboardEvent: {
					primary: (event: KeyboardEvent, key: string) => boolean;
				};

				/**
				 * Keycode for BACKSPACE key.
				 */
				BACKSPACE: 8;
				/**
				 * Keycode for TAB key.
				 */
				TAB: 9;
				/**
				 * Keycode for ENTER key.
				 */
				ENTER: 13;
				/**
				 * Keycode for ESCAPE key.
				 */
				ESCAPE: 27;
				/**
				 * Keycode for SPACE key.
				 */
				SPACE: 32;
				/**
				 * Keycode for PAGEUP key.
				 */
				PAGEUP: 33;
				/**
				 * Keycode for PAGEDOWN key.
				 */
				PAGEDOWN: 34;
				/**
				 * Keycode for END key.
				 */
				END: 35;
				/**
				 * Keycode for HOME key.
				 */
				HOME: 36;
				/**
				 * Keycode for LEFT key.
				 */
				LEFT: 37;
				/**
				 * Keycode for UP key.
				 */
				UP: 38;
				/**
				 * Keycode for RIGHT key.
				 */
				RIGHT: 39;
				/**
				 * Keycode for DOWN key.
				 */
				DOWN: 40;
				/**
				 * Keycode for DELETE key.
				 */
				DELETE: 46;
				/**
				 * Keycode for F10 key.
				 */
				F10: 121;
				/**
				 * Keycode for ALT key.
				 */
				ALT: 'alt';
				/**
				 * Keycode for CTRL key.
				 */
				CTRL: 'ctrl';
				/**
				 * Keycode for COMMAND/META key.
				 */
				COMMAND: 'meta';
				/**
				 * Keycode for SHIFT key.
				 */
				SHIFT: 'shift';
				/**
				 * Keycode for ZERO key.
				 */
				ZERO: 48;
			};
			keyboardShortcuts: {
				store: Store;
			};
			plugins: {
				registerPlugin: (pluginName: string, settings: unknown) => void;
			};
			privateApis: {
				__dangerousOptInToUnstableAPIsOnlyForCoreModules: (
					consent: string,
					moduleName: string,
				) => {
					lock: (object: unknown, privateData: unknown) => void;
					unlock: <T extends PrivateApis<unknown>>(
						object: T,
					) => T extends PrivateApis<infer Private> ? Private : never;
				};
			};
		};
	}
}

// biome-ignore lint/suspicious/noEmptyInterface: This is just to hold private api values
interface PrivateApis<Private> {}
