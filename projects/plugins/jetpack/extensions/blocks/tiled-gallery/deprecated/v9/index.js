import metadata from '../../block.json';

// Same attributes and supports as the current version — only the saved image URLs differ.
export const attributes = metadata.attributes;
export const supports = metadata.supports;
export { default as save } from './save';
