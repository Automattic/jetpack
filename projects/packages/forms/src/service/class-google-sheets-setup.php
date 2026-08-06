<?php
/**
 * Google Sheets sync setup.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Feedback;
use WP_Error;

/**
 * Class Google_Sheets_Setup
 *
 * Creates or validates the spreadsheet a form syncs its responses to, and lays
 * out the rows that go into it.
 *
 * The row layout lives here rather than at the call site because two very
 * different callers have to agree on it exactly: the backfill that runs on this
 * site when sync is switched on, and the WordPress.com worker that appends each
 * new response afterwards. A row written by one has to land under the same
 * headers as a row written by the other.
 */
class Google_Sheets_Setup {

	/**
	 * How many existing responses a backfill will seed at most.
	 *
	 * Backfill runs inside the enable request, so it is bounded to keep that
	 * request from timing out on a form with a very long history.
	 *
	 * @var int
	 */
	const BACKFILL_LIMIT = 1000;

	/**
	 * Header cells that precede the form's own fields.
	 *
	 * @return array
	 */
	private static function get_metadata_headers() {
		return array(
			__( 'Submitted', 'jetpack-forms' ),
			__( 'Source', 'jetpack-forms' ),
		);
	}

	/**
	 * Reduces the editor's column descriptors to a flat list of field IDs.
	 *
	 * Field IDs rather than labels are what get frozen onto the form and carried
	 * on each response, because a label can be edited without the column it
	 * corresponds to changing.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $columns List of arrays with 'id' and optional 'label'.
	 * @return array List of field IDs.
	 */
	public static function get_column_ids( array $columns ) {
		$ids = array();

		foreach ( $columns as $column ) {
			if ( is_array( $column ) && ! empty( $column['id'] ) ) {
				$ids[] = (string) $column['id'];
			}
		}

		return $ids;
	}

	/**
	 * Builds the spreadsheet's header row from a form's fields.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $columns List of arrays with 'id' and optional 'label'.
	 * @return array Flat list of header cells.
	 */
	public static function build_header_row( array $columns ) {
		$header = self::get_metadata_headers();

		foreach ( $columns as $column ) {
			if ( ! is_array( $column ) || empty( $column['id'] ) ) {
				continue;
			}

			$header[] = ! empty( $column['label'] ) ? (string) $column['label'] : (string) $column['id'];
		}

		return $header;
	}

	/**
	 * Lays a single response out as a spreadsheet row.
	 *
	 * Values are placed by field ID in the frozen column order, so a response
	 * missing a field leaves a blank cell instead of shifting every later value
	 * one column to the left.
	 *
	 * @since $$next-version$$
	 *
	 * @param Feedback $feedback   The response.
	 * @param array    $column_ids Field IDs, in the order the sheet's columns are in.
	 * @return array Flat list of cell values.
	 */
	public static function build_row( Feedback $feedback, array $column_ids ) {
		// The 'csv' context renders values as flat strings - it implodes the
		// multi-value field types - which is what a spreadsheet cell needs.
		$values = $feedback->get_compiled_fields( 'csv', 'id-value' );

		$row = array(
			$feedback->get_time(),
			$feedback->get_entry_short_permalink(),
		);

		foreach ( $column_ids as $column_id ) {
			$row[] = isset( $values[ $column_id ] ) ? (string) $values[ $column_id ] : '';
		}

		return $row;
	}

	/**
	 * Collects a form's existing responses as spreadsheet rows.
	 *
	 * @since $$next-version$$
	 *
	 * @param int   $form_post_id The jetpack_form post ID the responses hang off.
	 * @param array $columns      List of arrays with 'id' and optional 'label'.
	 * @return array List of rows, oldest first.
	 */
	public static function get_backfill_rows( $form_post_id, array $columns ) {
		$form_post_id = (int) $form_post_id;

		if ( $form_post_id <= 0 ) {
			return array();
		}

		$query = new \WP_Query(
			array(
				'post_type'      => Feedback::POST_TYPE,
				'post_status'    => 'publish',
				'post_parent'    => $form_post_id,
				'posts_per_page' => self::BACKFILL_LIMIT,
				'orderby'        => 'date',
				'order'          => 'ASC',
				'fields'         => 'ids',
			)
		);

		return self::build_rows_for_feedback_ids( $query->posts, self::get_column_ids( $columns ) );
	}

	/**
	 * Lays a set of responses out as spreadsheet rows.
	 *
	 * Split out from get_backfill_rows() so the row building is reachable without
	 * running a query: WP_Query returns nothing under the package's WorDBless test
	 * environment, which would otherwise leave this logic uncovered.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $feedback_ids Feedback post IDs, in the order they should appear.
	 * @param array $column_ids   Field IDs, in the order the sheet's columns are in.
	 * @return array List of rows.
	 */
	public static function build_rows_for_feedback_ids( array $feedback_ids, array $column_ids ) {
		$rows = array();

		foreach ( $feedback_ids as $feedback_id ) {
			$feedback = Feedback::get( $feedback_id );

			// Preview submissions are not real responses and should not be seeded.
			if ( ! $feedback instanceof Feedback || $feedback->is_test() ) {
				continue;
			}

			$rows[] = self::build_row( $feedback, $column_ids );
		}

		return $rows;
	}

	/**
	 * Creates or validates the destination spreadsheet for a form.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args {
	 *     @type int    $user_id         The user whose Google connection to use.
	 *     @type string $mode            'create' or 'existing'.
	 *     @type string $title           Title for a newly created spreadsheet.
	 *     @type string $spreadsheet_url Existing spreadsheet URL, when mode is 'existing'.
	 *     @type array  $columns         List of arrays with 'id' and optional 'label'.
	 *     @type array  $backfill_rows   Rows to seed, excluding the header. May be empty.
	 * }
	 * @return array|WP_Error Array with spreadsheet_id, spreadsheet_url and columns.
	 */
	public static function run( array $args ) {
		$column_ids = self::get_column_ids( $args['columns'] );

		if ( 'existing' === $args['mode'] ) {
			return self::use_existing_sheet( $args, $column_ids );
		}

		$rows  = array_merge( array( self::build_header_row( $args['columns'] ) ), $args['backfill_rows'] );
		$sheet = Google_Drive::create_sheet( $args['user_id'], $args['title'], $rows );

		if ( is_wp_error( $sheet ) ) {
			return $sheet;
		}

		if ( ! is_array( $sheet ) || empty( $sheet['sheet_id'] ) ) {
			return new WP_Error(
				'spreadsheet_not_created',
				__( 'The spreadsheet could not be created.', 'jetpack-forms' ),
				array( 'status' => 500 )
			);
		}

		return array(
			'spreadsheet_id'  => (string) $sheet['sheet_id'],
			'spreadsheet_url' => isset( $sheet['sheet_link'] ) ? (string) $sheet['sheet_link'] : '',
			'columns'         => $column_ids,
		);
	}

	/**
	 * Points a form at a spreadsheet the user already owns.
	 *
	 * Deliberately does not write a header row. The spreadsheet may already hold
	 * data and headings of the user's own, and overwriting row 1 would destroy
	 * them. Reconciling our columns against whatever is already there is left to
	 * the append path, which reads the live header before it writes.
	 *
	 * @param array $args       The arguments passed to run().
	 * @param array $column_ids The frozen column IDs.
	 * @return array|WP_Error
	 */
	private static function use_existing_sheet( array $args, array $column_ids ) {
		$sheet_id = Google_Drive::extract_sheet_id( $args['spreadsheet_url'] );

		if ( null === $sheet_id ) {
			return new WP_Error(
				'invalid_spreadsheet_url',
				__( 'That does not look like a Google Sheets link.', 'jetpack-forms' ),
				array( 'status' => 400 )
			);
		}

		$sheet = Google_Drive::get_sheet( $args['user_id'], $sheet_id );

		if ( is_wp_error( $sheet ) ) {
			return $sheet;
		}

		return array(
			'spreadsheet_id'  => $sheet_id,
			'spreadsheet_url' => is_array( $sheet ) && isset( $sheet['sheet_link'] ) ? (string) $sheet['sheet_link'] : '',
			'columns'         => $column_ids,
		);
	}
}
