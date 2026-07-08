<?php
/**
 * A second minimal report controller (distinct key/columns) for registry tests that
 * need more than one registered report. Keeps the pipeline tests independent of the
 * concrete report controllers.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Deterministic controller double with simple two-column output.
 */
class Fake_Report_Controller extends Abstract_Csv_Report_Controller {

	public function get_report_key(): string {
		return 'fakereport';
	}

	public function get_report_label(): string {
		return 'Fake Report';
	}

	public function get_data_endpoint(): string {
		return 'reports/fake-report';
	}

	public function get_column_headers( ?string $interval = null ): array {
		return array(
			'bucket' => 'Bucket',
			'count'  => 'Count',
		);
	}

	public function format_row_for_csv( array $item, ?string $interval = null ): array {
		$defaults = $this->get_default_values();
		return array(
			'bucket' => $item['bucket'] ?? $defaults['bucket'],
			'count'  => $item['count'] ?? $defaults['count'],
		);
	}

	public function get_default_values(): array {
		return array(
			'bucket' => '',
			'count'  => 0,
		);
	}
}
