import type { FindAllArgs } from 'highlight-words-core';
/**
 * Source:
 * https://github.com/bvaughn/react-highlight-words/blob/HEAD/src/Highlighter.js
 */
/**
 * @typedef Options
 * @property {string}                            [activeClassName='']      Classname for active highlighted areas.
 * @property {number}                            [activeIndex=-1]          The index of the active highlighted area.
 * @property {React.CSSProperties}               [activeStyle]             Styles to apply to the active highlighted area.
 * @property {boolean}                           [autoEscape]              Whether to automatically escape text.
 * @property {boolean}                           [caseSensitive=false]     Whether to highlight in a case-sensitive manner.
 * @property {string}                            children                  Children to highlight.
 * @property {FindAllArgs['findChunks']}         [findChunks]              Custom `findChunks` function to pass to `highlight-words-core`.
 * @property {string | Record<string, unknown>}  [highlightClassName='']   Classname to apply to highlighted text or a Record of classnames to apply to given text (which should be the key).
 * @property {React.CSSProperties}               [highlightStyle={}]       Styles to apply to highlighted text.
 * @property {keyof React.JSX.IntrinsicElements} [highlightTag='mark']     Tag to use for the highlighted text.
 * @property {FindAllArgs['sanitize']}           [sanitize]                Custom `sanitize` function to pass to `highlight-words-core`.
 * @property {string[]}                          [searchWords=[]]          Words to search for and highlight.
 * @property {string}                            [unhighlightClassName=''] Classname to apply to unhighlighted text.
 * @property {React.CSSProperties}               [unhighlightStyle]        Style to apply to unhighlighted text.
 */
interface Options {
    activeClassName?: string;
    activeIndex?: number;
    activeStyle?: React.CSSProperties;
    autoEscape?: boolean;
    caseSensitive?: boolean;
    children: string;
    findChunks?: FindAllArgs['findChunks'];
    highlightClassName?: string | Record<string, unknown>;
    highlightStyle?: React.CSSProperties;
    highlightTag?: keyof React.JSX.IntrinsicElements;
    sanitize?: FindAllArgs['sanitize'];
    searchWords?: string[];
    unhighlightClassName?: string;
    unhighlightStyle?: React.CSSProperties;
}
/**
 * @param options
 * @param options.activeClassName
 * @param options.activeIndex
 * @param options.activeStyle
 * @param options.autoEscape
 * @param options.caseSensitive
 * @param options.children
 * @param options.findChunks
 * @param options.highlightClassName
 * @param options.highlightStyle
 * @param options.highlightTag
 * @param options.sanitize
 * @param options.searchWords
 * @param options.unhighlightClassName
 * @param options.unhighlightStyle
 */
export declare function createHighlighterText({ activeClassName, activeIndex, activeStyle, autoEscape, caseSensitive, children, findChunks, highlightClassName, highlightStyle, highlightTag, sanitize, searchWords, unhighlightClassName, unhighlightStyle, }: Options): (import("react").DOMElement<Record<string, unknown>, Element> | import("react").DetailedReactHTMLElement<{
    children: string;
    className: string;
    key: number;
    style: import("react").CSSProperties | undefined;
}, HTMLElement>)[] | null;
export {};
//# sourceMappingURL=utils.d.ts.map