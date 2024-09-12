<?php
/**
 * Constants for the subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

const FEATURE_NAME                             = 'subscriptions';
const BLOCK_NAME                               = 'jetpack/' . FEATURE_NAME;
const NEWSLETTER_COLUMN_ID                     = 'newsletter_access';
const META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS = '_jetpack_newsletter_access';
const META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS    = '_jetpack_dont_email_post_to_subs';
const META_NAME_FOR_POST_TIER_ID_SETTINGS      = '_jetpack_newsletter_tier_id';
const META_NAME_CONTAINS_PAYWALLED_CONTENT     = '_jetpack_memberships_contains_paywalled_content';
const META_NAME_CONTAINS_PAID_CONTENT          = '_jetpack_memberships_contains_paid_content';
