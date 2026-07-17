/**
 * Generate the block embed code for a form.
 *
 * @param {number} postId - The form post ID.
 * @return {string} The block embed code.
 */
export const getEmbedCode = ( postId: number ): string =>
	`<!-- wp:jetpack/contact-form {"ref":${ postId }} /-->`;

/**
 * Generate the shortcode for a form.
 *
 * @param {number} postId - The form post ID.
 * @return {string} The shortcode.
 */
export const getShortcode = ( postId: number ): string => `[contact-form ref="${ postId }"]`;
