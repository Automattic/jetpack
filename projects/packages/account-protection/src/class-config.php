<?php
/**
 * Class used to define Config.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Class Config
 */
class Config {
	public const PREFIX                               = 'jetpack_account_protection';
	public const SUPPORT_LINK                         = 'https://jetpack.com/?post_type=jetpack_support&p=324199';
	public const RECENT_PASSWORD_HASHES_USER_META_KEY = self::PREFIX . '_recent_password_hashes';

	// Password Detection Constants
	public const PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION = 600; // 10 minutes
	public const PASSWORD_DETECTION_EMAIL_REQUEST_LIMIT   = 4;

	// Password Manager Constants
	public const PASSWORD_MANAGER_RECENT_PASSWORDS_LIMIT = 10;

	// Validation Service Constants
	public const VALIDATION_SERVICE_MIN_LENGTH = 6;
	public const VALIDATION_SERVICE_MAX_LENGTH = 150;
}
