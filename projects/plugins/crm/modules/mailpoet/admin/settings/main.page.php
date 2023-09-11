<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Admin: Settings page
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: MailPoet Sync Settings
 */
function jpcrm_settings_page_html_mailpoet_main(){

	global $zbs;

	$settings = $zbs->modules->mailpoet->settings->getAll();

    $delete_action_options = array(
        'delete'                      => __( 'Delete CRM contact and associated objects', 'zero-bs-crm' ),
        'delete_save_related_objects' => __( 'Delete CRM contact but leave associated objects', 'zero-bs-crm' ),
        'add_note'                    => __( 'Add a note to the CRM contact', 'zero-bs-crm' ),
        'none'                        => __( 'No action', 'zero-bs-crm' ),
    );

	// Act on any edits!
	if (isset($_POST['editwplf'])){

		// Retrieve
		$updatedSettings = array();

		// tag object settings
		$updatedSettings['tag_with_list'] = ( isset( $_POST['jpcrm_tag_with_list'] ) && !empty( $_POST['jpcrm_tag_with_list'] ) ? 1 : 0 );
		$updatedSettings['tag_with_tags'] = ( isset( $_POST['jpcrm_tag_with_tags'] ) && !empty( $_POST['jpcrm_tag_with_tags'] ) ? 1 : 0 );
		$updatedSettings['tag_list_prefix'] = ( isset( $_POST['jpcrm_tag_list_prefix'] ) ? jpcrm_sanitize_text_field_allow_whitespace( $_POST['jpcrm_tag_list_prefix'] ) : 'MailPoet List: ' );
		$updatedSettings['tag_tag_prefix'] = ( isset( $_POST['jpcrm_tag_tag_prefix'] ) ? jpcrm_sanitize_text_field_allow_whitespace( $_POST['jpcrm_tag_tag_prefix'] ) : 'MailPoet Tag: ' );

        // autolog changes
        $updatedSettings['autolog_changes'] = ( isset( $_POST['jpcrm_autolog_changes'] ) && !empty( $_POST['jpcrm_autolog_changes'] ) ? 1 : 0 );

        // delete action
        $updatedSettings['delete_action'] = ( isset( $_POST['jpcrm_delete_action'] ) && in_array( $_POST['jpcrm_delete_action'], array_keys( $delete_action_options ) ) ? sanitize_text_field( $_POST['jpcrm_delete_action'] ) : 'none' );

		#} Brutal update
		foreach ($updatedSettings as $k => $v){
			$zbs->modules->mailpoet->settings->update($k,$v);
		}

		// $msg out!
		$sbupdated = true;

		// Reload
		$settings = $zbs->modules->mailpoet->settings->getAll();

	}

	// Show Title
	jpcrm_render_setting_title( 'MailPoet Sync Settings', '' );

	?>
    <p style="padding-top: 18px; text-align:center;margin:1em">
		<?php
		echo sprintf(
			'<a href="%s" class="ui basic positive button" style="margin-top:1em"><i class="users icon"></i> %s</a>',
			jpcrm_esc_link( $zbs->slugs['mailpoet'] ),
			esc_html__( 'MailPoet Sync Hub', 'zero-bs-crm' )
		); ?>
    </p>
    <p id="sbDesc"><?php esc_html_e( 'Here you can configure the global settings for MailPoet Sync.', 'zero-bs-crm' ); ?></p>


	<?php if (isset($sbupdated)) if ($sbupdated) { echo '<div class="ui message success">'. esc_html__( 'Settings Updated', 'zero-bs-crm' ) . '</div>'; } ?>

    <div id="sbA">
    <form method="post">
        <input type="hidden" name="editwplf" id="editwplf" value="1" />
        <table class="table table-bordered table-striped wtab">

            <thead>

            <tr>
                <th colspan="2" class="wmid"><?php esc_html_e('MailPoet Sync Settings','zero-bs-crm'); ?>:</th>
            </tr>

            </thead>

            <tbody>

            <tr>
                <td class="wfieldname"><label for="jpcrm_tag_with_list"><?php esc_html_e( 'Tag Contact with MailPoet List(s)', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e('Tick to tag your contact with any MailPoet lists they are present on.','zero-bs-crm'); ?></td>
                <td style="width:540px"><input type="checkbox" class="winput form-control" name="jpcrm_tag_with_list" id="jpcrm_tag_with_list" value="1"<?php if ( isset( $settings['tag_with_list'] ) && $settings['tag_with_list'] == "1" ) echo ' checked="checked"'; ?> /></td>
            </tr>

            <tr>
                <td class="wfieldname"><label for="jpcrm_tag_list_prefix"><?php esc_html_e( 'List tag prefix','zero-bs-crm'); ?>:</label><br /><?php esc_html_e('Enter a tag prefix for List tags (e.g. MailPoet List: )', 'zero-bs-crm' ); ?></td>
                <td style='width:540px'><input type="text" class="winput form-control" name="jpcrm_tag_list_prefix" id="jpcrm_tag_list_prefix" value="<?php if ( isset( $settings['tag_list_prefix']) && !empty( $settings['tag_list_prefix'] ) ) echo esc_attr( $settings['tag_list_prefix'] ); ?>" placeholder="<?php esc_html_e( "e.g. 'MailPoet List: '", 'zero-bs-crm' ); ?>" /></td>
            </tr>
            
            <?php
                # We don't have tag retrieval yet as it's a new feature to MailPoet :)
            ?>
            <tr>
                <td class="wfieldname"><label for="jpcrm_tag_with_tags"><?php esc_html_e( 'Tag Contact with MailPoet Tag(s)', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Tick to tag your contact with any MailPoet tags they are tagged with.', 'zero-bs-crm' ); ?></td>
                <td style="width:540px"><input type="checkbox" class="winput form-control" name="jpcrm_tag_with_tags" id="jpcrm_tag_with_tags" value="1"<?php if ( isset( $settings['tag_with_tags'] ) && $settings['tag_with_tags'] == "1" ) echo ' checked="checked"'; ?> /></td>
            </tr>

            <tr>
                <td class="wfieldname"><label for="jpcrm_tag_tag_prefix"><?php esc_html_e( 'List tag prefix','zero-bs-crm'); ?>:</label><br /><?php esc_html_e('Enter a tag prefix for Subscriber tags (e.g. MailPoet Tag: )', 'zero-bs-crm' ); ?></td>
                <td style='width:540px'><input type="text" class="winput form-control" name="jpcrm_tag_tag_prefix" id="jpcrm_tag_tag_prefix" value="<?php if ( isset( $settings['tag_tag_prefix']) && !empty( $settings['tag_tag_prefix'] ) ) echo esc_attr( $settings['tag_tag_prefix'] ); ?>" placeholder="<?php esc_attr_e( "e.g. 'MailPoet Tag: '", 'zero-bs-crm' ); ?>" /></td>
            </tr>

            <tr>
                <td class="wfieldname"><label for="jpcrm_autolog_changes"><?php esc_html_e( 'Autolog changes to subscribers', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Tick to add a note to a contact each time changes made in MailPoet subscribers are reflected in CRM contacts', 'zero-bs-crm' ); ?></td>
                <td style="width:540px"><input type="checkbox" class="winput form-control" name="jpcrm_autolog_changes" id="jpcrm_autolog_changes" value="1"<?php if ( isset( $settings['autolog_changes'] ) && $settings['autolog_changes'] == "1" ) echo ' checked="checked"'; ?> /></td>
            </tr>

            <tr>
                <td class="wfieldname"><label for="jpcrm_delete_action"><?php esc_html_e( 'Subscriber deleted action', 'zero-bs-crm' ); ?>:</label><br /><?php esc_html_e( 'Choose what should happen to CRM contacts when a MailPoet subscriber is deleted in MailPoet.', 'zero-bs-crm' ); ?></td>
                <td style="width:540px">
                    <select class="winput form-control" name="jpcrm_delete_action" id="jpcrm_delete_action">
                        <?php

                            foreach ( $delete_action_options as $value => $label ){

                                ?><option value="<?php echo esc_attr( $value ); ?>"<?php 
                                if ( isset( $settings['delete_action'] ) && $settings['delete_action'] == $value ){
                                    echo ' selected="selected"';
                                }
                                ?>><?php echo esc_html( $label ); ?></option><?php

                            }

                        ?>
                    </select>
                </td>
            </tr>


            </tbody>
        </table>

        <table class="table table-bordered table-striped wtab">
            <tbody>

            <tr>
                <td colspan="2" class="wmid"><button type="submit" class="button button-primary button-large"><?php esc_html_e('Save Settings','zero-bs-crm'); ?></button></td>
            </tr>

            </tbody>
        </table>

    </form>

    </div><?php

}