/**
 * Stands in for the block editor's per-block crash boundary, so a crash reaches the comment editor's own.
 *
 * @param {object}                    props          - Props.
 * @param {import('react').ReactNode} props.children - The block.
 * @return {import('react').ReactNode} The block.
 */
export default ( { children } ) => children;
