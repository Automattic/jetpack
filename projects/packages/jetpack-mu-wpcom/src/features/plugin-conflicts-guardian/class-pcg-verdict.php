<?php
/**
 * Verdict value object for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * A compatibility check result: a status band plus the human-readable
 * reasons that led to it. `raw` carries the inputs the verdict was
 * derived from so the admin/CLI can show debug info without re-fetching.
 */
class PCG_Verdict {

	const STATUS_SAFE  = 'safe';
	const STATUS_WARN  = 'warn';
	const STATUS_BLOCK = 'block';

	/**
	 * Verdict status: 'safe', 'warn', or 'block'.
	 *
	 * @var string
	 */
	public $status;

	/**
	 * Reasons, in the order they were collected.
	 *
	 * @var string[]
	 */
	public $reasons = array();

	/**
	 * Raw inputs the verdict was derived from (wporg metadata + site state).
	 *
	 * @var array
	 */
	public $raw = array();

	/**
	 * Construct a verdict.
	 *
	 * @param string   $status  Verdict status.
	 * @param string[] $reasons Reasons list.
	 * @param array    $raw     Raw payloads used to compute the verdict.
	 */
	public function __construct( $status = self::STATUS_SAFE, array $reasons = array(), array $raw = array() ) {
		$this->status  = $status;
		$this->reasons = $reasons;
		$this->raw     = $raw;
	}

	/**
	 * Flatten the verdict to a plain array, ready for JSON/CLI output.
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'status'  => $this->status,
			'reasons' => $this->reasons,
			'raw'     => $this->raw,
		);
	}
}
