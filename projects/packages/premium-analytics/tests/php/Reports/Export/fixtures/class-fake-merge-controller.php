<?php
/**
 * Minimal report controller with deterministic defaults and identifying fields,
 * used to drive the merge-strategy tests without depending on a real report's mapping.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Deterministic controller double for merge-strategy tests.
 */
class Fake_Merge_Controller extends Abstract_Csv_Report_Controller {

	public function get_report_key(): string {
		return 'fakemerge';
	}

	public function get_report_label(): string {
		return 'Fake Merge';
	}

	public function get_data_endpoint(): string {
		return 'reports/fake';
	}

	public function get_column_headers( ?string $interval = null ): array {
		return array(
			'product_id' => 'ID',
			'label'      => 'Label',
			'sales'      => 'Sales',
		);
	}

	public function format_row_for_csv( array $item, ?string $interval = null ): array {
		return $item;
	}

	public function get_default_values(): array {
		return array( 'sales' => 0 );
	}

	public function get_matching_field(): ?string {
		return 'product_id';
	}

	public function get_identifying_fields(): array {
		return array( 'label' );
	}
}
