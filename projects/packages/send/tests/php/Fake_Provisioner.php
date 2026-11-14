<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase, WordPress.Files.FileName.InvalidClassFileName -- Test helper.
/**
 * In-memory provisioner for tests.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

/**
 * Returns a fixed sub-account.
 */
class Fake_Provisioner implements Provisioner {

	/**
	 * Type.
	 *
	 * @return string
	 */
	public function get_type() {
		return 'local';
	}

	/**
	 * Fixed provisioning result.
	 *
	 * @param string $domain Domain.
	 * @return array
	 */
	public function provision( $domain ) {
		return array(
			'handle'           => 'jpsendfake',
			'api_key'          => 'fake-key',
			'lockdown_auth_id' => 'jpsendfake',
			'monthly_limit'    => 3000,
			'dns_records'      => array(
				array(
					'type'    => 'TXT',
					'name'    => 'jpsend._domainkey.' . $domain,
					'value'   => 'v=DKIM1; p=ABC',
					'purpose' => 'dkim',
				),
			),
		);
	}

	/**
	 * Fixed usage.
	 *
	 * @param array $account Account.
	 * @return array
	 */
	public function get_usage( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by the interface.
		return array(
			'total_usage'   => 12,
			'monthly_limit' => 3000,
			'period_start'  => '2026-10-01',
			'period_end'    => '2026-10-31',
		);
	}

	/**
	 * Always succeeds.
	 *
	 * @param array $account Account.
	 * @return true
	 */
	public function deprovision( array $account ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by the interface.
		return true;
	}
}
