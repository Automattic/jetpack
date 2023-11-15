// Links and media attached to tweets take up 24 characters each.
const ATTACHMENT_MESSAGE_PADDING = 24;

// The maximum length is 280 characters, but there'll always be a URL attached (plus a space).
const MAXIMUM_MESSAGE_LENGTH = 280 - ATTACHMENT_MESSAGE_PADDING - 1;

/**
 * Get the maximum length that a share message can be.
 *
 * @returns {number} The maximum length of a share message.
 */
export function getShareMessageMaxLength() {
	return MAXIMUM_MESSAGE_LENGTH;
}
