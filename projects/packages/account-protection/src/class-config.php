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
	public const TRANSIENT_PREFIX                     = 'jetpack_account_protection';
	public const RECENT_PASSWORD_HASHES_USER_META_KEY = 'jetpack_account_protection_recent_password_hashes';

	// Password Detection Constants
	public const PASSWORD_DETECTION_ERROR_CODE            = 'password_detection_validation_error';
	public const PASSWORD_DETECTION_EMAIL_SENT_EXPIRATION = 600; // 10 minutes
	public const PASSWORD_DETECTION_EMAIL_REQUEST_LIMIT   = 4;

	// Password Manager Constants
	public const PASSWORD_MANAGER_RECENT_PASSWORDS_LIMIT = 10;

	// Validation Service Constants
	public const VALIDATION_SERVICE_MIN_LENGTH = 6;
	public const VALIDATION_SERVICE_MAX_LENGTH = 150;
}
