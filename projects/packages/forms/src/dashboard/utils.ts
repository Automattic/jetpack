/**
 * Get the edit URL for a form post.
 *
 * @param formId - The form post ID.
 * @return The relative edit URL path.
 */
export function getFormEditUrl( formId: number ): string {
	return `post.php?post=${ formId }&action=edit`;
}
