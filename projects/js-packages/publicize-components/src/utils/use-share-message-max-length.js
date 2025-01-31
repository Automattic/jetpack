import { RESTRICTIONS } from '../hooks/use-media-restrictions/restrictions';
import useSocialMediaConnections from '../hooks/use-social-media-connections';

// Links and media attached to tweets take up 24 characters each.
const ATTACHMENT_MESSAGE_PADDING = 24;

// The maximum length is 280 characters, but there'll always be a URL attached (plus a space).
export const MAXIMUM_MESSAGE_LENGTH = 280 - ATTACHMENT_MESSAGE_PADDING - 1;

/**
 * Get the maximum length that a share message can be.
 *
 * @return {number} The maximum length of a share message.
 */
export function useShareMessageMaxLength() {
	const { enabledConnections } = useSocialMediaConnections();

	// Get the char limits for enabled connections
	const charLimits = enabledConnections
		.map( connection => RESTRICTIONS[ connection.service_name ]?.charLimit )
		.filter( limit => limit !== undefined );

	// Get the minimum char limit, default to MAXIMUM_MESSAGE_LENGTH
	return charLimits.length > 0 ? Math.min( ...charLimits ) : MAXIMUM_MESSAGE_LENGTH;
}
