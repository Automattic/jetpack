/**
 * The sections that describe the post's newsletter send rather than the post itself: email
 * identity in the header, no date controls, widgets pinned to the send window.
 */
export const EMAIL_SECTION_SLUGS: readonly string[] = [ 'email-opens', 'email-clicks' ];

/**
 * Whether a section slug is one of the email sections.
 *
 * @param slug - The section slug.
 * @return Whether the section reports over the send window.
 */
export function isEmailSection( slug: string | undefined ): boolean {
	return slug !== undefined && EMAIL_SECTION_SLUGS.includes( slug );
}
