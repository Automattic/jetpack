const ignoredPseudoElements = [
    'after',
    'before',
    'first-(line|letter)',
    '(input-)?placeholder',
    'scrollbar',
    'search(results-)?decoration',
    'search-(cancel|results)-button',
];
let removePseudoElementRegex;
/**
 * Builds a RegExp for finding pseudo elements that should be ignored while matching
 * elements that are above the fold.
 *
 * @return {RegExp} A RegExp to use when removing unwanted pseudo elements.
 */
function getRemovePseudoElementRegex() {
    if (removePseudoElementRegex) {
        return removePseudoElementRegex;
    }
    const allIgnored = ignoredPseudoElements.join('|');
    removePseudoElementRegex = new RegExp('::?(-(moz|ms|webkit)-)?(' + allIgnored + ')');
    return removePseudoElementRegex;
}
/**
 * Remove pseudo elements that are ignored while matching elements above the fold.
 *
 * @param {string} selector - selector to filter.
 *
 * @return {string} selector with ignored pseudo elements removed.
 */
export function removeIgnoredPseudoElements(selector) {
    return selector.replace(getRemovePseudoElementRegex(), '').trim();
}
//# sourceMappingURL=ignored-pseudo-elements.js.map