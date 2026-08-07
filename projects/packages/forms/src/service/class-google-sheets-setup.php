<?php
/**
 * Google Sheets sync setup.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Contact_Form;
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
	 * Normalizes the column list to a flat list of field labels.
	 *
	 * Columns are keyed on the field's label rather than its ID. A field's ID
	 * looks stable but is not: when a field block carries no explicit `id`, the
	 * server derives one as `g{context}-{label}`, where the context is the ID of
	 * the *post the form is rendered on*. A synced form reused across two pages
	 * therefore produces different field IDs on each, and renaming a field
	 * changes its ID too. Labels are what the spreadsheet's header shows, what
	 * the CSV export already keys on, and what survives being embedded twice.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $columns List of field labels.
	 * @return array List of non-empty field labels.
	 */
	public static function get_column_labels( array $columns ) {
		$labels = array();

		foreach ( $columns as $column ) {
			if ( is_string( $column ) && '' !== trim( $column ) ) {
				$labels[] = $column;
			}
		}

		return $labels;
	}

	/**
	 * Builds the spreadsheet's header row from a form's fields.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $columns List of field labels.
	 * @return array Flat list of header cells.
	 */
	public static function build_header_row( array $columns ) {
		return array_merge( self::get_metadata_headers(), self::get_column_labels( $columns ) );
	}

	/**
	 * Reads a form's field labels straight off the stored form.
	 *
	 * Resolved here rather than in the editor for two reasons: the integrations
	 * modal is rendered from three places, one of which (the responses dashboard)
	 * has no block context at all, and the duplicate-label rule below has to match
	 * Feedback_Field::get_label() exactly or the columns will not line up with the
	 * values the append path produces.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $form_post_id The jetpack_form post ID.
	 * @return array List of field labels, in form order.
	 */
	public static function get_form_columns( $form_post_id ) {
		$form_post = get_post( (int) $form_post_id );

		if ( ! $form_post instanceof \WP_Post ) {
			return array();
		}

		return self::get_columns_from_content( $form_post->post_content );
	}

	/**
	 * Reads field labels out of a form's block markup.
	 *
	 * Split from get_form_columns() so the parsing and the duplicate-label rule
	 * are reachable without a stored post: the package's WorDBless test
	 * environment hands back post_content still slashed, which defeats
	 * parse_blocks() on the block attribute JSON.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $content The form's block markup.
	 * @return array List of field labels, in document order.
	 */
	public static function get_columns_from_content( $content ) {
		$labels = array();
		$counts = array();

		foreach ( self::collect_field_labels( parse_blocks( (string) $content ) ) as $label ) {
			// Mirrors Feedback_Field::get_label(): the nth use of a label gets an
			// " (n)" suffix, and a field with no label of its own reads as "Field".
			$label = '' === $label ? __( 'Field', 'jetpack-forms' ) : $label;

			$counts[ $label ] = isset( $counts[ $label ] ) ? $counts[ $label ] + 1 : 1;
			$labels[]         = $counts[ $label ] > 1 ? $label . ' (' . $counts[ $label ] . ')' : $label;
		}

		return $labels;
	}

	/**
	 * Walks a block tree and collects the label of every form field.
	 *
	 * Recurses because fields are routinely nested inside steps, groups and
	 * columns rather than sitting directly under the form.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array List of raw labels, in document order.
	 */
	private static function collect_field_labels( array $blocks ) {
		$labels = array();

		foreach ( $blocks as $block ) {
			$name = isset( $block['blockName'] ) ? (string) $block['blockName'] : '';

			if ( str_starts_with( $name, 'jetpack/field-' ) ) {
				$labels[] = self::get_field_label( $block );

				// Do not recurse into a field. Its inner blocks are its own layout
				// parts - jetpack/label, jetpack/input - and, on multiple-choice
				// fields, jetpack/field-option-* blocks whose `label` holds the
				// option text. Those match the `jetpack/field-` prefix, so
				// recursing here would turn every option into its own column.
				continue;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$labels = array_merge( $labels, self::collect_field_labels( $block['innerBlocks'] ) );
			}
		}

		return $labels;
	}

	/**
	 * Resolves the label a single field block renders with.
	 *
	 * Modern field blocks keep the label in an inner `jetpack/label` block rather
	 * than in an attribute of their own, so reading `attrs['label']` alone names
	 * every column "Field". Older markup does carry the attribute, and the core
	 * form patterns declare no label at all and fall back to the type default -
	 * all three shapes reach the sheet, so all three are resolved here.
	 *
	 * Mirrors Forms_Abilities::summarize_field_block(), which resolves the same
	 * three shapes for the abilities API.
	 *
	 * @param array $block A parsed `jetpack/field-*` block.
	 * @return string The label, or an empty string when none can be resolved.
	 */
	private static function get_field_label( array $block ) {
		$label = '';

		foreach ( ( $block['innerBlocks'] ?? array() ) as $inner ) {
			if ( ( $inner['blockName'] ?? '' ) === 'jetpack/label' && ! empty( $inner['attrs']['label'] ) ) {
				$label = (string) $inner['attrs']['label'];
				break;
			}
		}

		if ( '' === $label && ! empty( $block['attrs']['label'] ) ) {
			$label = (string) $block['attrs']['label'];
		}

		if ( '' === $label ) {
			$type  = str_replace( 'jetpack/field-', '', isset( $block['blockName'] ) ? (string) $block['blockName'] : '' );
			$label = Contact_Form::get_default_label_from_type( $type );
		}

		return wp_strip_all_tags( (string) $label );
	}

	/**
	 * Lays a single response out as a spreadsheet row.
	 *
	 * Values are placed by label in the frozen column order, so a response
	 * missing a field leaves a blank cell instead of shifting every later value
	 * one column to the left.
	 *
	 * @since $$next-version$$
	 *
	 * @param Feedback $feedback      The response.
	 * @param array    $column_labels Field labels, in the order the sheet's columns are in.
	 * @return array Flat list of cell values.
	 */
	public static function build_row( Feedback $feedback, array $column_labels ) {
		// The 'csv' context renders values as flat strings - it implodes the
		// multi-value field types - which is what a spreadsheet cell needs. The
		// 'label-value' shape is the same one the CSV export uses, so repeated
		// labels arrive already disambiguated as "Name", "Name (2)", and so on.
		$values = $feedback->get_compiled_fields( 'csv', 'label-value' );

		$row = array(
			$feedback->get_time(),
			$feedback->get_entry_short_permalink(),
		);

		foreach ( $column_labels as $label ) {
			$row[] = isset( $values[ $label ] ) ? (string) $values[ $label ] : '';
		}

		return $row;
	}

	/**
	 * Collects a form's existing responses as spreadsheet rows.
	 *
	 * @since $$next-version$$
	 *
	 * @param int   $form_post_id The jetpack_form post ID the responses hang off.
	 * @param array $columns      List of field labels.
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

		return self::build_rows_for_feedback_ids( $query->posts, self::get_column_labels( $columns ) );
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
	 * @param array $column_labels Field labels, in the order the sheet's columns are in.
	 * @return array List of rows.
	 */
	public static function build_rows_for_feedback_ids( array $feedback_ids, array $column_labels ) {
		$rows = array();

		foreach ( $feedback_ids as $feedback_id ) {
			$feedback = Feedback::get( $feedback_id );

			// Preview submissions are not real responses and should not be seeded.
			if ( ! $feedback instanceof Feedback || $feedback->is_test() ) {
				continue;
			}

			$rows[] = self::build_row( $feedback, $column_labels );
		}

		return $rows;
	}

	/**
	 * Creates or validates the destination spreadsheet for a form.
	 *
	 * Expected keys in `$args`:
	 * - `user_id` (int): the user whose Google connection to use.
	 * - `mode` (string): 'create' or 'existing'.
	 * - `title` (string): title for a newly created spreadsheet.
	 * - `spreadsheet_url` (string): existing spreadsheet URL, when mode is 'existing'.
	 * - `columns` (array): list of field labels.
	 * - `backfill_rows` (array): rows to seed, excluding the header. May be empty.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args Setup arguments, as described above.
	 * @return array|WP_Error Array with spreadsheet_id, spreadsheet_url and columns.
	 */
	public static function run( array $args ) {
		$column_labels = self::get_column_labels( $args['columns'] );

		if ( 'existing' === $args['mode'] ) {
			return self::use_existing_sheet( $args, $column_labels );
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
			'columns'         => $column_labels,
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
	 * @param array $column_labels The frozen column labels.
	 * @return array|WP_Error
	 */
	private static function use_existing_sheet( array $args, array $column_labels ) {
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
			'columns'         => $column_labels,
		);
	}
}
