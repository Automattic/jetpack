<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers;

class Source_Provider_State {
	protected $success_ratio;
	/**
	 * @var string[]
	 */
	protected $error;

	/**
	 * @var mixed
	 */
	protected $urls;

	private $status;

	const SUCCESS    = 'success';
	const ERROR      = 'error';
	const REQUESTING = 'requesting';

	public function __construct( $state ) {
		$this->urls          = $state['urls'];
		$this->success_ratio = $state['success_ratio'];
		$this->error         = $state['error'];
		$this->status        = $state['status'];
	}

	public function set_as_success() {
		// If this success was result of a retry by Cloud_CSS_Cron. This provider may contain error data from the
		// original attempt. We have to remove that first.
		$this->error  = null;
		$this->status = self::SUCCESS;
	}

	public function set_as_failed( $error ) {
		$this->error  = $error;
		$this->status = self::ERROR;
	}

	public function cancel_request() {
		$this->status = self::ERROR;
	}

	public function has_errors() {
		return ! empty( $this->error );
	}

	public function is_requesting() {
		return $this->status === self::REQUESTING;
	}

	public function is_successful() {
		return $this->status === self::SUCCESS;
	}

	public function get_urls() {
		return $this->urls;
	}

	public function get_success_ratio() {
		return $this->success_ratio;
	}

	public function prepare_new_request( $urls, $success_ratio ) {
		$this->urls          = $urls;
		$this->success_ratio = $success_ratio;
		$this->error         = null;
		$this->status        = self::REQUESTING;
	}

	public function get_status() {
		return array(
			'urls'          => $this->urls,
			'success_ratio' => $this->success_ratio,
			'error'         => $this->error,
			'status'        => $this->status,
		);
	}
}
