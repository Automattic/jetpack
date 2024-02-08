// Example URLs
// https://www.eventbrite.com/e/test-event-tickets-123456789
// https://www.eventbrite.co.uk/e/test-event-tickets-123456789
export const URL_REGEX =
	/^\s*https?:\/\/(?:www\.)?(?:eventbrite\.[a-z.]+)\/e\/[^/]*?(\d+)\/?(?:\?[^/]*)?\s*$/i;

// Custom eventbrite urls use a subdomain of eventbrite.com
export const CUSTOM_URL_REGEX =
	/^\s*https?:\/\/(?:.+\.)?(?:eventbrite\.[a-z.]+)\/?(?:\?[^/]*)?\s*$/i;

export const EVENTBRITE_EXAMPLE_URL = 'https://www.eventbrite.com/e/test-event-tickets-123456789';
