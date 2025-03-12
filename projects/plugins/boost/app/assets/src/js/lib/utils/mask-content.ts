/**
 * Masks content to prevent WAF false positives.
 * Make sure to update the PHP masking function
 * when this one is updated.
 *
 * @param content - The content to mask.
 * @return The masked content.
 */
export default function maskContent( content: string ): string {
	return content.replace( /xmlns/g, '__JB_XMLNS__' );
}
