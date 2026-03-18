/**
 * Get the edit URL for a form post.
 *
 * @param formId   - The form post ID.
 * @param adminUrl - The wp-admin base URL (e.g. "https://example.com/wp-admin/").
 * @return           The edit URL.
 */
export function getFormEditUrl( formId: number, adminUrl?: string ): string {
	return `${ adminUrl ?? '' }post.php?post=${ formId }&action=edit`;
}
