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
	public const TRANSIENT_PREFIX      = 'password_detection';
	public const ERROR_CODE            = 'password_detection_validation_error';
	public const ERROR_MESSAGE         = 'Password validation failed.';
	public const EMAIL_SENT_EXPIRATION = 600; // 10 minutes
	public const MAX_RESEND_ATTEMPTS   = 3;
}
