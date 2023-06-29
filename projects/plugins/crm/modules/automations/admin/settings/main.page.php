<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Automation: Admin: Settings page
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Page: Automation Settings
 */
function jpcrm_settings_page_html_automation_main(){

	global $zbs;

	$settings = $zbs->modules->automation->settings->getAll();


	// Act on any edits!
	if (isset($_POST['editwplf'])){

		// Retrieve
		$updatedSettings = array();

		#TBC
		$updatedSettings['example'] = ( isset( $_POST['jpcrm_example'] ) && !empty( $_POST['jpcrm_example'] ) ? 1 : 0 );
		
		#} Brutal update
		foreach ($updatedSettings as $k => $v){
			$zbs->modules->automation->settings->update($k,$v);
		}

		// $msg out!
		$sbupdated = true;

		// Reload
		$settings = $zbs->modules->automation->settings->getAll();

	}

	// Show Title
	jpcrm_render_setting_title( 'Automation Settings', '' );

	?>
    <p style="padding-top: 18px; text-align:center;margin:1em">
		<?php
		echo sprintf(
			'<a href="%s" class="ui basic positive button" style="margin-top:1em"><i class="cogs icon"></i> %s</a>',
			zbsLink( $zbs->slugs['automation-listview'] ),
			__( 'Automation', 'zero-bs-crm' )
		); ?>
    </p>
    <p id="sbDesc"><?php _e( 'Here you can configure the global settings for Automation.', 'zero-bs-crm' ); ?></p>


	<?php if (isset($sbupdated)) if ($sbupdated) { echo '<div class="ui message success">'. __( 'Settings Updated', 'zero-bs-crm' ) . '</div>'; } ?>

    <div id="sbA">
    <form method="post">
        <input type="hidden" name="editwplf" id="editwplf" value="1" />
        <table class="table table-bordered table-striped wtab">

            <thead>

            <tr>
                <th colspan="2" class="wmid"><?php _e('Automation Settings','zero-bs-crm'); ?>:</th>
            </tr>

            </thead>

            <tbody>

            <tr>
                <td class="wfieldname"><label for="jpcrm_example"><?php _e( 'Example setting', 'zero-bs-crm' ); ?>:</label><br /><?php _e('bla bla bla.','zero-bs-crm'); ?></td>
                <td style="width:540px"><input type="checkbox" class="winput form-control" name="jpcrm_example" id="jpcrm_example" value="1"<?php if ( isset( $settings['example'] ) && $settings['example'] == "1" ) echo ' checked="checked"'; ?> /></td>
            </tr>

            </tbody>
        </table>

        <table class="table table-bordered table-striped wtab">
            <tbody>

            <tr>
                <td colspan="2" class="wmid"><button type="submit" class="button button-primary button-large"><?php _e('Save Settings','zero-bs-crm'); ?></button></td>
            </tr>

            </tbody>
        </table>

    </form>

    </div><?php

}