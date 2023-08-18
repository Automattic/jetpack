<?php
/*
!
 * Export Page
 * Jetpack CRM - https://jetpackcrm.com
 */

	defined( 'ZEROBSCRM_PATH' ) || exit;

	// permissions check
if ( ! zeroBSCRM_permsExport() ) {
	wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'zero-bs-crm' ) );
}

	/**
	 * Export UI Preflight error
	 **/
function jpcrm_export_preflight_error( $message ) {

	echo '<h2>' . esc_html( $message ) . '</h2><button class="ui blue button" onclick="history.back()">' . esc_html( __( 'Go Back', 'zerob-bs-crm' ) ) . '</button>';
}

	/**
	 * Export page UI
	 **/
function jpcrm_render_export_page() {

	global $zbs;

	// secondary permissions check
	if ( ! zeroBSCRM_permsExport() ) {

		return jpcrm_export_preflight_error( __( 'You do not have permissions to access this page.' ) );

	}

	// == Retrieve objs to export =========

	// v3.0 is basic mvp, just exports based on ID's
	// 3.0+ should take list view params + regen

	$ids_to_export   = array();
	$extra_title_str = '';

	// check for obj type passed?
	if ( ! empty( $_GET['zbstype'] ) ) {

		$obj_type_str = sanitize_text_field( $_GET['zbstype'] );

	} elseif ( ! empty( $_POST['objtype'] ) ) {

		$obj_type_str = sanitize_text_field( $_POST['objtype'] );

	} else {

		// fallback as contact
		$obj_type_str = 'contact';

	}

	// get obj type ID
	$obj_type_id = $zbs->DAL->objTypeID( $obj_type_str );

	// bad object type, so fail
	if ( ! $zbs->DAL->isValidObjTypeID( $obj_type_id ) ) {
		return jpcrm_export_preflight_error( __( 'Invalid object selected for export!' ) );
	}

	// no perms for this object
	if ( ! zeroBSCRM_permsObjType( $obj_type_id ) ) {
		return jpcrm_export_preflight_error( __( 'You do not have permissions to access this page.' ) );
	}

	// get segment id, if exporting segment
	// (only for contacts)
	$potential_segment_id = -1;
	$potential_segment    = false;
	if ( $obj_type_id == ZBS_TYPE_CONTACT && ! empty( $_GET['segment-id'] ) ) {

		// segment export
		$potential_segment_id = sanitize_text_field( $_GET['segment-id'] );
		$potential_segment    = $zbs->DAL->segments->getSegment( $potential_segment_id );

	}

	// got IDs
	if ( ! empty( $_POST['ids'] ) ) {

		$potential_id_csv = sanitize_text_field( $_POST['ids'] );
		$potential_ids    = explode( ',', $potential_id_csv );

		foreach ( $potential_ids as $potential_id ) {

			$id = (int) $potential_id;

			if ( $id > 0 && ! in_array( $id, $ids_to_export ) ) {
				$ids_to_export[] = $id;
			}
		}

		$obj_count         = count( $ids_to_export );
		$ids_to_export_csv = implode( ',', $ids_to_export );

	} elseif ( is_array( $potential_segment ) ) {

		// got a segment to export
		$obj_count         = $potential_segment['compilecount'];
		$ids_to_export_csv = 'segment';
		$extra_title_str   = sprintf( __( ' (In Segment %s)', 'zero-bs-crm' ), $potential_segment['name'] );

	} else {

		$obj_count         = $zbs->DAL->getObjectLayerByType( $obj_type_id )->getFullCount();
		$ids_to_export_csv = 'all'; // :o HUGE?

	}

	// bad object type, so fail
	if ( $obj_count == 0 ) {
		return jpcrm_export_preflight_error( __( 'No objects to export!' ) );
	}

	// == / Retrieve objs to export =======

	// == Prep language + vars ============

	// what fields do we have to export?
	$fieldsAvailable = zeroBSCRM_export_produceAvailableFields( $obj_type_id, true );

	// obj layer
	$objDALLayer = $zbs->DAL->getObjectLayerByType( $obj_type_id );

	// language
	$objTypeSingular = $zbs->DAL->typeStr( $obj_type_id, false );
	$objTypePlural   = $zbs->DAL->typeStr( $obj_type_id, true );

	// basic label 'contact/contacts'
	$exportTypeLabel = $objTypeSingular;
	if ( $obj_count > 1 ) {
		$exportTypeLabel = $objTypePlural;
	}

	// == / Prep language + vars ===========

	// == UI ==============================

	// good to draw ?>
	<div id="zbs-export-wrap"><form method="post">

	<?php /* here we output the pre-requisites for the export (which is caught on init) */ ?>
	<input type="hidden" name="jpcrm-export-request" value="<?php echo esc_attr( time() ); ?>" />
	<?php wp_nonce_field( 'zbs_export_request', 'jpcrm-export-request-nonce' ); ?>
	<input type="hidden" name="jpcrm-export-request-objtype" value="<?php echo esc_attr( $obj_type_id ); ?>" />
	<input type="hidden" name="jpcrm-export-request-objids" value="<?php echo esc_attr( $ids_to_export_csv ); ?>" />
	<?php if ( is_array( $potential_segment ) ) { ?>
	<input type="hidden" name="jpcrm-export-request-segment-id" value="<?php echo esc_attr( $potential_segment_id ); ?>" />
	<?php } ?>

	<h2><?php echo esc_html__( sprintf( __( 'Export %1$s %2$s %3$s', 'zero-bs-crm' ), zeroBSCRM_prettifyLongInts( $obj_count ), $exportTypeLabel, $extra_title_str ) ); ?></h2>

	<div class="ui segment" id="zbs-export-filetype-wrap">
	<i class="file alternate outline icon"></i> <?php esc_html_e( 'Export as .CSV file', 'zero-bs-crm' ); // later offer choice (excel variant? Outlook addressbook?) ?>
	</div>  

	<div class="ui segments" id="zbs-export-fields-wrap">
	<div class="ui segment header">
	<?php

	// header
	esc_html_e( 'Export Fields:', 'zero-bs-crm' );

	// select all
	?>
	<button type="button" class="ui black mini button right floated all" id="zbs-export-select-all" ><span class="all"><i class="object ungroup icon"></i> <?php esc_html_e( 'Deselect All', 'zero-bs-crm' ); ?></span><span class="none" style="display:none"><i class="object group icon"></i> <?php esc_html_e( 'Select All', 'zero-bs-crm' ); ?></span></button>

	</div>
	<div class="ui segment" id="zbs-export-fields">
	<?php

	if ( count( $fieldsAvailable ) > 0 ) {

		$lastArea = '';
		$openArea = false;

		// if got type, retrieve fields to (potentially) export.
		foreach ( $fieldsAvailable as $fK => $field ) {

			/*
			Semantic checkboxes bugging, working on MVP so simplified for now.
			?>
			<div>
			<div class="ui checkbox">
			<input type="checkbox" id="zbs-export-field-<?php echo $fK; ?>"  name="zbs-export-field-<?php echo $fK; ?>">
			<label><?php echo $fLabel; ?></label>
			</div>
			</div>
			<?php */

			// area grouping
			if ( isset( $field['area'] ) && $field['area'] !== $lastArea ) {

				// close any open areas
				if ( $openArea ) {
					echo '</div>';
					$openArea = false;
				}

				if ( $field['area'] !== '' ) {

					// open 'area'
					$openArea = true;
					$lastArea = $field['area'];
					?>
			<div class="ui segment"><div class="ui small header"><?php echo esc_html( $field['area'] ); ?></div>
					<?php

				}
			}

			?>
		<input type="checkbox" id="zbs-export-field-<?php echo esc_attr( $fK ); ?>" name="zbs-export-field-<?php echo esc_attr( $fK ); ?>" checked="checked" value="<?php echo esc_attr( $fK ); ?>" /><label for="zbs-export-field-<?php echo esc_attr( $fK ); ?>"><?php echo esc_html( $field['label'] ); ?></label><br />
			<?php

		}

		// close any open areas
		if ( $openArea ) {
			echo '</div>';
		}
	} else {

		// nope.
		echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'No fields to export', 'zero-bs-crm' ), __( 'There were no fields found that we can export.', 'zero-bs-crm' ) . '</a>', '', 'zbs-legacy-export-tools-dialog' );

	}

	?>
	</div>
	</div>

	<div class="ui divider"></div>

	<button class="ui black button" type="submit"><i class="download icon"></i> <?php esc_html_e( 'Export', 'zero-bs-crm' ); ?></button>

	<script type="text/javascript">

	jQuery(function(){

		jQuery('#zbs-export-select-all').on( 'click', function(){

		if (jQuery(this).hasClass('none')){

			// check all
			jQuery('input:checkbox',jQuery('#zbs-export-fields')).prop( 'checked', true );

			jQuery(this).removeClass('none');
			jQuery('span.none').hide();
			jQuery('span.all').show();
			jQuery(this).addClass('all');

		} else {

			// deselect all
			jQuery('input:checkbox',jQuery('#zbs-export-fields')).prop( 'checked', false );

			jQuery(this).removeClass('all');
			jQuery('span.all').hide();
			jQuery('span.none').show();
			jQuery(this).addClass('none');

		}

		});

	});

	</script>

	</form></div>
	<?php

	// == / UI ============================
}
