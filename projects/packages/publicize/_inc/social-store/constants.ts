// See projects/packages/publicize/src/jetpack-social-settings/class-settings.php
export const SIG_SETTINGS_KEY = 'jetpack_social_image_generator_settings';
export const UTM_ENABLED_KEY = 'jetpack_social_utm_settings';
export const SOCIAL_NOTES_ENABLED_KEY = 'jetpack-social-note';
export const SOCIAL_NOTES_CONFIG_KEY = 'jetpack_social_notes_config';
export const SHOW_PRICING_PAGE_KEY = 'jetpack-social_show_pricing_page';
export const MESSAGE_TEMPLATE_KEY = 'jetpack_social_message_template';

export const CUSTOMIZE_PER_NETWORK_KEY = '_wpas_customize_per_network';

/**
 * Services that require an intermediate input step
 */
export const CONNECTION_FLOW_INPUT_SERVICES = [ 'bluesky', 'mastodon' ] as const;

/**
 * This is to avoid creating a new empty array each time.
 *
 * This helps to avoid unnecessary changes to the reference of the array.
 */
export const EMPTY_ARRAY = [];

/**
 * Same as {@link EMPTY_ARRAY}, for selectors returning an object.
 */
export const EMPTY_OBJECT = {};
