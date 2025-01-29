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
	public const EMAIL_SENT_EXPIRATION = 600; // 10 minutes
	public const MAX_RESEND_ATTEMPTS   = 3;
}
