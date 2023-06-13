<?php
/*
!
 * System Assistant: System status page
 */

global $zbs;

jpcrm_render_system_title( __( 'System Status', 'zero-bs-crm' ) );

zeroBSCRM_render_systemstatus_page();

/**
 * Render v3 migration logs section
 */
function jpcrm_render_system_v3migration_log() {

	global $zbs;

	if ( $zbs->isDAL3() ) {

		// check for any migration 'errors' + also expose here.
		$errors = get_option( 'zbs_db_migration_300_errstack', array() );

		$bodyStr = '<h2>' . __( 'Migration Completion Report', 'zero-bs-crm' ) . '</h2>';

		if ( is_array( $errors ) && count( $errors ) > 0 ) {

			// this is a clone of what gets sent to them by email, but reusing the html gen here

			// build report
			$bodyStr  = '<h2>' . __( 'Migration Completion Report', 'zero-bs-crm' ) . '</h2>';
			$bodyStr .= '<p style="font-size:1.3em">' . __( 'Unfortunately there were some migration errors, which are shown below. The error messages should explain any conflicts found when merging, (this has also been emailed to you for your records).', 'zero-bs-crm' ) . ' ' . __( 'Please visit the migration support page', 'zero-bs-crm' ) . ' <a href="' . $zbs->urls['db3migrate'] . '" target="_blank">' . __( 'here', 'zero-bs-crm' ) . '</a> ' . __( 'if you require any further information.', 'zero-bs-crm' ) . '</p>';
			$bodyStr .= '<div style="position: relative;background: #FFFFFF;box-shadow: 0px 1px 2px 0 rgba(34,36,38,0.15);margin: 1rem 0em;padding: 1em 1em;border-radius: 0.28571429rem;border: 1px solid rgba(34,36,38,0.15);margin-right:1em !important"><h3>' . __( 'Non-critical Errors:', 'zero-bs-crm' ) . '</h3>';

			// expose Timeouts
			$timeoutIssues = zeroBSCRM_getSetting( 'migration300_timeout_issues' );
			if ( isset( $timeoutIssues ) && $timeoutIssues == 1 ) {
				echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Timeout', 'zero-bs-crm' ), __( 'While this migration ran it hit one or more timeouts. This indicates that your server may be unperformant at scale with Jetpack CRM', 'zero-bs-crm' ) );
			}

				// list errors
			foreach ( $errors as $error ) {

				$bodyStr     .= '<div class="ui vertical segment">';
				$bodyStr     .= '<div class="ui grid">';
					$bodyStr .= '<div class="two wide column right aligned"><span class="ui orange horizontal label">[' . $error[0] . ']</span></div>';
					$bodyStr .= '<div class="fourteen wide column"><p style="font-size: 1.1em;">' . $error[1] . '</p></div>';
				$bodyStr     .= '</div>';
				$bodyStr     .= '</div>';

			}

			$bodyStr .= '</div>';

		} else {

			$bodyStr .= zeroBSCRM_UI2_messageHTML( 'info', __( 'V3.0 Migration Completed Successfully', 'zero-bs-crm' ), __( 'There were no errors when migrating your CRM install to v3.0', 'zero-bs-crm' ), '', 'zbs-succcessfulyv3' );

		}

		echo $bodyStr;

		?><p style="text-align:center;margin:2em">
			<?php if ( zeroBSCRM_isZBSAdminOrAdmin() ) { ?>
			<a href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status&cacheCheck=1' ); ?>" class="ui button teal"><?php esc_html_e( 'View Migration Cache', 'zero-bs-crm' ); ?></a><?php } ?>
			<a href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status' ); ?>" class="ui button blue"><?php esc_html_e( 'Back to System Status', 'zero-bs-crm' ); ?></a>
		</p>
		<?php

	} else {

		// Not migrated yet? What?
		echo '<p>' . esc_html__( 'You have not yet migrated to v3.0', 'zero-bs-crm' ) . '</p>';

	}
}

/**
 * Render v3 cachecheck section
 */
function jpcrm_render_system_cachecheck() {

	global $zbs, $wpdb, $ZBSCRM_t;

		$zbsCPTs = array(
			'zerobs_customer'     => _x( 'Contact', 'Contact Info (not the verb)', 'zero-bs-crm' ),
			'zerobs_company'      => _x( jpcrm_label_company(), 'A ' . jpcrm_label_company() . ', e.g. incorporated organisation', 'zero-bs-crm' ),
			'zerobs_invoice'      => _x( 'Invoice', 'Invoice object (not the verb)', 'zero-bs-crm' ),
			'zerobs_quote'        => _x( 'Quote', 'Quote object (not the verb) (proposal)', 'zero-bs-crm' ),
			'zerobs_quo_template' => _x( 'Quote Template', 'Quote template object (not the verb)', 'zero-bs-crm' ),
			'zerobs_transaction'  => _x( 'Transaction', 'Transaction object (not the verb)', 'zero-bs-crm' ),
			'zerobs_form'         => _x( 'Form', 'Website Form object (not shape)', 'zero-bs-crm' ),
		);

		echo '<div style="margin:1em;">';
		echo '<h2>' . esc_html__( 'Migration Cache', 'zero-bs-crm' ) . '</h2>';

		if ( isset( $_GET['clearCache'] ) ) {

			// dump cache

			if ( ! isset( $_GET['imsure'] ) ) {

				// sure you want to clear cache?
				$message  = '<p>' . __( 'Are you sure you want to delete the migration object cache?', 'zero-bs-crm' ) . '</p>';
				$message .= '<p>' . __( 'Clearing this cache will remove all backups the CRM has kept of previous data', 'zero-bs-crm' ) . '</p>';
				$message .= '<p>' . __( '(This will free up database space and will not affect your current CRM data, but please note this cannot be undone)', 'zero-bs-crm' ) . '</p>';
				$message .= '<p>';
				$message .= '<a href="' . wp_nonce_url( '?page=' . $zbs->slugs['systemstatus'] . '&tab=status&cacheCheck=1&clearCache=1&imsure=1', 'pleaseremovemigrationcache' ) . '" class="ui button orange">' . __( 'Clear Migration Cache', 'zero-bs-crm' ) . '</a>';
				$message .= '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status" class="ui button blue">' . __( 'Back to System Status', 'zero-bs-crm' ) . '</a>';
				$message .= '</p>';

				echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Clear Migration Object Cache?', 'zero-bs-crm' ), $message, 'warning', 'clearObjCache' );

			} else {

				// if sure, clear cache
				if ( wp_verify_nonce( $_GET['_wpnonce'], 'pleaseremovemigrationcache' ) ) {

					// is admin, passed 'I'm Sure' nonce check... clear the cache
					$objCount     = $zbs->DAL->truncate( 'dbmigrationbkposts' );
					$objMetaCount = $zbs->DAL->truncate( 'dbmigrationbkmeta' );

					// and store a log as audit trail
					$log = get_option( 'zbs_dbmig_cacheclear' );
					if ( ! is_array( $log ) ) {
						$log = array();
					}
					$log[] = time();
					update_option( 'zbs_dbmig_cacheclear', $log, false );

					// cleared
					$message  = '<p>' . __( 'You have cleared the migration object cache', 'zero-bs-crm' ) . '</p>';
					$message .= '<p>' . zeroBSCRM_prettifyLongInts( $objCount ) . ' x ' . __( 'Object', 'zero-bs-crm' ) . ' & ' . zeroBSCRM_prettifyLongInts( $objMetaCount ) . ' x ' . __( 'Meta', 'zero-bs-crm' ) . '</p>';
					$message .= '<p>';
					$message .= '<a href="' . zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status" class="ui button blue">' . __( 'Back to System Status', 'zero-bs-crm' ) . '</a>';
					$message .= '</p>';

					echo zeroBSCRM_UI2_messageHTML( 'info', __( 'Cleared Migration Object Cache', 'zero-bs-crm' ), $message, 'warning', 'clearObjCache' );

				} else {

					// nonce not verified, spoof attempt
					exit();

				}
			}
		} else {

			// show cache

			?>
			<table class="table table-bordered table-striped wtab">
			 
				<thead>
				  
						<tr>
							<th colspan="2" class="wmid"><?php esc_html_e( 'Pre-Migration Object Cache', 'zero-bs-crm' ); ?>:</th>
						</tr>

					</thead>
					
					<tbody>
					<?php

					foreach ( $zbsCPTs as $cpt => $label ) {

							$count = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(ID) FROM ' . $ZBSCRM_t['dbmigrationbkposts'] . ' WHERE post_type = %s', $cpt ) );

						?>
				<tr>
					<td class="wfieldname">
						<label for="cpt_<?php esc_attr_e( $cpt ); ?>">
						<?php esc_html( sprintf( _x( '%s Objects:', 'table field label', 'zero-bs-crm' ), $label ) ); ?>
						</label>
					</td>
					<td><?php echo esc_html( zeroBSCRM_prettifyLongInts( $count ) ); ?></td>
					</tr>
							<?php

					}

					?>
			</tbody></table><p style="text-align:center;margin:2em">
				<?php if ( zeroBSCRM_isZBSAdminOrAdmin() ) { ?>
				<a href="<?php echo esc_url( wp_nonce_url( '?page=' . $zbs->slugs['systemstatus'] . '&tab=status&cacheCheck=1&clearCache=1', 'clearmigrationcache' ) ); ?>" class="ui button orange"><?php esc_html_e( 'Clear Migration Cache', 'zero-bs-crm' ); ?></a><?php } ?>
				<a href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status' ); ?>" class="ui button blue"><?php esc_html_e( 'Back to System Status', 'zero-bs-crm' ); ?></a>
			</p>
			<?php

		}

		echo '</div>';
}

function zeroBSCRM_render_systemstatus_page() {

	global $wpdb, $zbs;  // } Req

	$normalSystemStatusPage = true;

	// catch v3 migration notes
	if ( isset( $_GET['v3migrationlog'] ) ) {

		$normalSystemStatusPage = false;
		jpcrm_render_system_v3migration_log();

	} elseif ( isset( $_GET['cacheCheck'] ) && zeroBSCRM_isZBSAdminOrAdmin() ) {

		$normalSystemStatusPage = false;
		jpcrm_render_system_cachecheck();

	}

	if ( $normalSystemStatusPage ) {

		$settings = $zbs->settings->getAll();

		// catch tools:
		if ( current_user_can( 'admin_zerobs_manage_options' ) && isset( $_GET['resetuserroles'] ) && wp_verify_nonce( $_GET['_wpnonce'], 'resetuserroleszerobscrm' ) ) {

			// roles
			zeroBSCRM_clearUserRoles();

			// roles +
			zeroBSCRM_addUserRoles();

			// flag
			$userRolesRebuilt = true;
		}

		// check for, and prep any general sys status errs:
		$generalErrors = array();

		// migration blocker (failed migrations looping)
		$migBlocks = get_option( 'zbsmigrationblockerrors', false );
		if ( $migBlocks !== false && ! empty( $migBlocks ) ) {
			$generalErrors['migrationblock'] = __( 'A migration has been blocked from completing. Please contact support.', 'zero-bs-crm' ) . ' (#' . $migBlocks . ')';

			// add ability to 'reset migration block'
			$generalErrors['migrationblock'] .= '<br /><a href="' . wp_nonce_url( '?page=' . $zbs->slugs['systemstatus'] . '&tab=status&resetmigrationblock=1', 'resetmigrationblock' ) . '">' . __( 'Retry the Migration', 'zero-bs-crm' ) . '</a>';

		}

		// hard-check database tables & report

		global $ZBSCRM_t,$wpdb;
		$missingTables = array();
		$tablesExist   = $wpdb->get_results( "SHOW TABLES LIKE '" . $ZBSCRM_t['keys'] . "'" );
		if ( count( $tablesExist ) < 1 ) {
			$missingTables[] = $ZBSCRM_t['keys'];
		}

		// then we cycle through our tables :) - means all keys NEED to be kept up to date :)
		foreach ( $ZBSCRM_t as $tableKey => $tableName ) {
			$tablesExist = $wpdb->get_results( "SHOW TABLES LIKE '" . $tableName . "'" );
			if ( count( $tablesExist ) < 1 ) {
				$missingTables[] = $tableName;
			}
		}

		// missing tables?
		if ( count( $missingTables ) > 0 ) {

			$generalErrors['missingtables']  = __( 'Jetpack CRM has failed creating the tables it needs to operate. Please contact support.', 'zero-bs-crm' ) . ' (#306)';
			$generalErrors['missingtables'] .= '<br />' . __( 'The following tables could not be created:', 'zero-bs-crm' ) . ' (' . implode( ', ', $missingTables ) . ')';

		}

		// Got any persisitent SQL errors on db table creation?
		$creationErrors = get_option( 'zbs_db_creation_errors' );
		if ( is_array( $creationErrors ) && isset( $creationErrors['lasttried'] ) ) {

			// has persistent SQL creation errors
			$generalErrors['creationsql'] = __( 'Jetpack CRM experienced errors while trying to build it\'s database tables. Please contact support sharing the following errors:', 'zero-bs-crm' ) . ' (#306sql)';
			if ( is_array( $creationErrors['errors'] ) ) {
				foreach ( $creationErrors['errors'] as $err ) {

								$generalErrors['creationsql'] .= '<br />&nbsp;&nbsp;' . $err;

				}
			}
		}

		?>
	
		<p><?php esc_html_e( 'This page allows easy access for the various system status variables related to your WordPress install and Jetpack CRM.', 'zero-bs-crm' ); ?></p>

		<?php
		if ( isset( $userRolesRebuilt ) && $userRolesRebuilt ) {
			echo '<div style="width:500px; margin-left:20px;" class="wmsgfullwidth">';
			zeroBSCRM_html_msg( 0, __( 'User Roles Rebuilt', 'zero-bs-crm' ) );
			echo '</div>'; }
		?>
		
		<?php
		if ( count( $generalErrors ) > 0 ) {

			foreach ( $generalErrors as $err ) {
				echo zeroBSCRM_UI2_messageHTML( 'warning', '', $err, '', '' );
			}
		}
		?>

		<div id="sbA" style="margin-right:1em">


					<?php

					// CLEARS OUT MIGRATION HISTORY :o $zbs->settings->update('migrations',array());

					// ================================================================
					// == ZBS relative
					// ================================================================

						$zbsEnvList = array(

							'corever'       => 'CRM Core Version',
							'dbver'         => 'Database Version',
							'dalver'        => 'DAL Version',
							'mysql'         => 'MySQL Version',
							'innodb'        => 'InnoDB Storage Engine',
							'sqlrights'     => 'SQL Permissions',
							'locale'        => 'Locale',
							'assetdir'      => 'Asset Upload Directory',
							'wordpressver'  => 'WordPress Version',
							'local'         => 'Server Connectivity',
							'localtime'     => 'DateTime Setting',
							'devmode'       => 'Dev/Production Mode',
							'permalinks'    => 'Pretty Permalinks',
							'fontinstalled' => 'Noto Sans Font installed',
						);

						// only show these for legacy users using DAL<3
						// #backward-compatibility
						if ( ! $zbs->isDAL3() ) {
							$zbsEnvList['autodraftgarbagecollect'] = 'Auto-draft Garbage Collection';
						}

						if ( count( $zbsEnvList ) ) {
							?>
				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					  
							<tr>
								<th colspan="2" class="wmid"><?php esc_html_e( 'CRM Environment', 'zero-bs-crm' ); ?>:</th>
							</tr>

						</thead>
					  
						<tbody>

							<?php
							foreach ( $zbsEnvList as $envCheckKey => $envCheckName ) {

								// } Retrieve
								$result = zeroBSCRM_checkSystemFeat( $envCheckKey, true );

								?>

						<tr>
							<td class="wfieldname"><label for="wpzbscrm_env_<?php echo esc_attr( $envCheckKey ); ?>"><?php esc_html_e( $envCheckName, 'zero-bs-crm' ); ?>:</label></td>
							<td style="width:540px">
								<?php
								if ( ! $result[0] && $envCheckKey != 'devmode' ) {
									echo '<div class="ui yellow label">' . esc_html__( 'Warning', 'zero-bs-crm' ) . '</div>&nbsp;&nbsp;';
								}
								?>
								<?php echo wp_kses( $result[1], $zbs->acceptable_restricted_html ); ?></td>
						</tr>

							<?php } ?>
	  
						</tbody>

					</table>


					<?php } ?>


					<?php

					// ================================================================
					// == Server relative
					// ================================================================

						$servEnvList = array(
							'serverdefaulttime'    => 'Server Default Timezone',
							'curl'                 => 'cURL',
							'zlib'                 => 'zlib (Zip Library)',
							'mb_internal_encoding' => 'Multibyte String (mbstring PHP module)',
							'dompdf'               => 'PDF Engine',
							'pdffonts'             => 'PDF Font Set',
							'phpver'               => 'PHP Version',
							'memorylimit'          => 'Memory Limit',
							'executiontime'        => 'Max Execution Time',
							'postmaxsize'          => 'Max File POST',
							'uploadmaxfilesize'    => 'Max File Upload Size',
							'wpuploadmaxfilesize'  => 'WordPress Max File Upload Size',
							'encryptionmethod'     => 'Encryption Method',
						);

						if ( count( $servEnvList ) ) {
							?>
				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					  
							<tr>
								<th colspan="2" class="wmid"><?php esc_html_e( 'Server Environment', 'zero-bs-crm' ); ?>:</th>
							</tr>

						</thead>
					  
						<tbody>

							<?php
							foreach ( $servEnvList as $envCheckKey => $envCheckName ) {

								// } Retrieve
								$result = zeroBSCRM_checkSystemFeat( $envCheckKey, true );

								?>

						<tr>
							<td class="wfieldname"><label for="wpzbscrm_env_<?php echo esc_attr( $envCheckKey ); ?>"><?php esc_html_e( $envCheckName, 'zero-bs-crm' ); ?>:</label></td>
							<td style="width:540px"><?php echo wp_kses( $result[1], $zbs->acceptable_restricted_html ); ?></td>
						</tr>

							<?php } ?>

							<?php do_action( 'zbs_server_checks' ); ?>
	  
						</tbody>

					</table>

					<?php } ?>


					<?php

					// ================================================================
					// == WordPress relative
					// ================================================================

						$wpEnvList = array(); // none yet :)

					if ( count( $wpEnvList ) ) {
						?>
				<table class="table table-bordered table-striped wtab" >
				 
					<thead>
					  
							<tr>
								<th colspan="2" class="wmid"><?php esc_html_e( 'WordPress Environment', 'zero-bs-crm' ); ?>:</th>
							</tr>

						</thead>
					  
						<tbody>

						<?php
						foreach ( $wpEnvList as $envCheckKey => $envCheckName ) {

								// } Retrieve
								$result = zeroBSCRM_checkSystemFeat( $envCheckKey, true );

							?>

						<tr>
							<td class="wfieldname"><label for="wpzbscrm_env_<?php echo esc_attr( $envCheckKey ); ?>"><?php esc_html_e( $envCheckName, 'zero-bs-crm' ); ?>:</label></td>
							<td style="width:540px"><?php echo wp_kses( $result[1], $zbs->acceptable_restricted_html ); ?></td>
						</tr>

						<?php } ?>
	  
						</tbody>

					</table>

					<?php } ?>


					<?php

					// ================================================================
					// == ZBS relative: Migrations
					// ================================================================

						// 2.88 moved this to show all migrations, completed or failed.

						global $zeroBSCRM_migrations;
						$migratedAlreadyArr = zeroBSCRM_migrations_getCompleted(); // from 2.88 $zbs->settings->get('migrations');

						// temp
						// n/a, fixed $migrationVers = array('123'=>'1.2.3','1119' => '1.1.19','127'=>'1.2.7','2531'=>'2.53.1','2943'=>'2.94.3','2952' => '2.95.2');
						$migrationVers = array();

					if ( is_array( $zeroBSCRM_migrations ) && count( $zeroBSCRM_migrations ) > 0 ) {
						?>
				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					  
							<tr>
								<th colspan="2" class="wmid"><?php esc_html_e( 'Jetpack CRM Migrations Completed', 'zero-bs-crm' ); ?>:</th>
							</tr>

						</thead>
					  
						<tbody>

						<?php
						foreach ( $zeroBSCRM_migrations as $migrationkey ) {

								// $migrationDetail = get_option('zbsmigration'.$migrationkey);
								$migrationDetails = jpcrm_migrations_get_migration( $migrationkey );
								$migrationDetail  = $migrationDetails[1];
								// array('completed'=>time(),'meta'=>array('updated'=>'['.$quotesUpdated.','.$invsUpdated.']')));

								$migrationName = $migrationkey;
							if ( isset( $migrationVers[ $migrationkey ] ) ) {
								$migrationName = $migrationVers[ $migrationkey ];
							}

								// 29999 => 2.99.99
								$migrationName = zeroBSCRM_format_migrationVersion( $migrationName );

							?>

						<tr>
							<td class="wfieldname"><label for="wpzbscrm_mig_<?php echo esc_attr( $migrationkey ); ?>"><?php esc_html_e( 'Migration: ' . $migrationName, 'zero-bs-crm' ); ?>:</label></td>
							<td style="width:540px">
							<?php

							if ( isset( $migrationDetail['completed'] ) ) {

								echo esc_html( __( 'Completed', 'zero-bs-crm' ) . ' ' . date( 'F j, Y, g:i a', $migrationDetail['completed'] ) );
								if ( isset( $migrationDetail['meta'] ) && isset( $migrationDetail['meta']['updated'] ) ) {

									// pretty up
									$md = $migrationDetail['meta']['updated'];
									if ( $migrationDetail['meta']['updated'] == 1 ) {
										$md = __( 'Success', 'zero-bs-crm' );
									}
									if ( $migrationDetail['meta']['updated'] == -1 ) {
										$md = __( 'Fail/NA', 'zero-bs-crm' );
									}
									if ( $migrationDetail['meta']['updated'] == 0 ) {
										$md = __( 'Success', 'zero-bs-crm' ); // basically
									}

									echo ' (' . esc_html( $md ) . ')';

								}
							} else {
								echo esc_html__( 'Not yet run', 'zero-bs-crm' );
							}

							?>
								</td>
						</tr>

						<?php } ?>

						<?php

						// expose migration Timeouts
						$timeoutIssues = zeroBSCRM_getSetting( 'migration300_timeout_issues' );
						if ( isset( $timeoutIssues ) && $timeoutIssues == 1 ) {
							echo '<tr><td colspan="2" style="text-align:center"><strong>' . esc_html__( 'Timeouts', 'zero-bs-crm' ) . '</strong>: ' . esc_html__( 'One or more migrations experienced timeouts while running. This may indicate that your server is not performing very well.', 'zero-bs-crm' ) . '</td></tr>';
						}

						?>
	  
						</tbody>

					</table>


					<?php } ?>
				  
				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					
						<tr>
							<th colspan="2" class="wmid"><?php esc_html_e( 'Extensions', 'zero-bs-crm' ); ?>:</th>
						</tr>

					</thead>
					
					<tbody>

						<?php
						$exts = zeroBSCRM_installedProExt();
						if ( is_array( $exts ) && count( $exts ) > 0 ) {

							// simple list em (not complex like connect page)
							foreach ( $exts as $shortName => $e ) {

								?>
							<tr><td><?php echo esc_html( $e['name'] ); ?></td><td><?php echo esc_html( $e['ver'] ); ?></td></tr>
								<?php

							}
						} else {

							?>
						<tr><td colspan="2"><div style="">
							<?php

												$message = __( 'No Extensions Detected', 'zero-bs-crm' );
												// upsell/connect if not wl
												##WLREMOVE
												$message .= '<br /><a href="' . $zbs->urls['products'] . '">' . __( 'Purchase Extensions', 'zero-bs-crm' ) . '</a> or <a href="' . $zbs->slugs['settings'] . '&tab=license">' . __( 'Add License Key', 'zero-bs-crm' ) . '</a>';
												##/WLREMOVE

							?>
						</div></td></tr>
							<?php

						}
						?>



					</tbody>

				</table>
				<div id="zbs-licensing-debug" style="display:none;border:1px solid #ccc;margin:1em;padding:1em;background:#FFF">
					<?php
					if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
						$l   = $zbs->DAL->setting( 'licensingcount', 0 );
						$err = $zbs->DAL->setting( 'licensingerror', false );
						$key = $zbs->settings->get( 'license_key' );

						echo 'Attempts:' . esc_html( $l ) . '<br/>Err:<pre>' . print_r( $err, 1 ) . '</pre><br/>key:<pre>' . print_r( $key, 1 ) . '</pre>';

					}
					?>
				</div>

				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					
						<tr>
							<th colspan="2" class="wmid"><?php esc_html_e( 'External Source Register:', 'zero-bs-crm' ); ?></th>
						</tr>

					</thead>
					
					<tbody>

						<?php
						if ( is_array( $zbs->external_sources ) && count( $zbs->external_sources ) > 0 ) {

							// simple list em
							foreach ( $zbs->external_sources as $key => $extsource ) {

								?>
							<tr><td><?php echo esc_html( $extsource[0] . ' (' . $key . ')' ); ?></td><td>
											<?php
											if ( isset( $extsource['ico'] ) && ! empty( $extsource['ico'] ) ) {
												echo '<i class="fa ' . esc_attr( $extsource['ico'] ) . '"></i>';
											} else {
												echo '???';
											}
											?>
							</td></tr>
								<?php

							}
						} else {

							?>
						<tr><td colspan="2"><div style="">
							<?php

												$message = __( 'No External Sources Registered. Please contact support!', 'zero-bs-crm' );

							?>
						</div></td></tr>
							<?php

						}
						?>



					</tbody>

				</table>

				<table class="table table-bordered table-striped wtab">
				 
					<thead>
					
						<tr>
							<th colspan="2" class="wmid"><?php esc_html_e( 'Packages Installed:', 'zero-bs-crm' ); ?></th>
						</tr>

					</thead>
					
					<tbody>

						<?php

						// load package installer
						$package_installer = $zbs->load_package_installer();

						// get packages
						$packages = $package_installer->list_all_available_packages( true );

						// draw
						if ( is_array( $packages ) && count( $packages ) > 0 ) {

							// list them
							foreach ( $packages as $package_key => $package_info ) {

								?>
							<tr class="package-<?php echo esc_attr( $package_key ); ?>">
								<td><?php echo esc_html( $package_info['title'] ); ?></td>
								<td>
								<?php

								if ( is_array( $package_info['installed'] ) ) {

									echo esc_html( sprintf( __( 'Version %s Installed', 'zero-bs-crm' ), number_format( $package_info['installed']['version'], 1 ) ) );

								} else {

									esc_html_e( 'Not Installed', 'zero-bs-crm' );

									// retrieve failed_installs
									if ( isset( $package_info['failed_installs'] ) && $package_info['failed_installs'] > 0 ) {

										echo '<br><i class="exclamation triangle icon red"></i> ' . wp_kses( sprintf( __( '%1$d attempts to install this package failed. Please <a href="%2$s" target="_blank">contact support</a>.', 'zero-bs-crm' ), $package_info['failed_installs'], esc_url( $zbs->urls['support'] ) ), $zbs->acceptable_restricted_html );

									}
								}

									// could offer 'force reinstall' tool here, but lets see if we need it

								?>
								</td>
							</tr>
								<?php

							}
						} else {

							?>
							<tr><td colspan="2"><div style="">
													<?php

													$message = __( 'No External Sources Registered. Please contact support!', 'zero-bs-crm' );

													?>
							</div></td></tr>
													<?php

						}
						?>



					</tbody>

				</table>

				<?php

					// if admin + has perf logs to show
				if ( zeroBSCRM_isWPAdmin() ) {
					$zbsPerfTestOpt = get_option( 'zbs-global-perf-test', array() );

					if ( is_array( $zbsPerfTestOpt ) && count( $zbsPerfTestOpt ) > 0 ) {

						?>
					<table class="table table-bordered table-striped wtab">
					   
						<thead>
						  
								<tr>
									<th colspan="3" class="wmid"><?php esc_html_e( 'Performance Tests', 'zero-bs-crm' ); ?>:</th>
								</tr>
						  
								<tr>
									<th class=""><?php esc_html_e( 'Started', 'zero-bs-crm' ); ?>:</th>
									<th class="wmid"><?php esc_html_e( 'Get', 'zero-bs-crm' ); ?>:</th>
									<th class=""><?php esc_html_e( 'Results', 'zero-bs-crm' ); ?>:</th>
								</tr>

							</thead>
						  
							<tbody>

							<?php

								// simple list em
							foreach ( $zbsPerfTestOpt as $perfTest ) {

								?>
								<tr>

								<td>
								<?php

								if ( isset( $perfTest['init'] ) ) {
									echo esc_html( date( 'F j, Y, g:i a', $perfTest['init'] ) );
								}

								?>
								</td>

								<td>
								<?php

								if ( isset( $perfTest['get'] ) && is_array( $perfTest['get'] ) ) {
									echo '<pre>' . print_r( $perfTest['get'], 1 ) . '</pre>';
								}

								?>
								</td>

								<td>
								<?php

								if ( isset( $perfTest['results'] ) && is_array( $perfTest['results'] ) ) {
									echo '<pre>' . print_r( $perfTest['results'], 1 ) . '</pre>';
								}

								?>
								</td>

								</tr>
								<?php

							}

							?>

							</tbody>

					</table>
							<?php
					} // / has perf tests

				} // / admin
				?>

				<div class="ui segment">
				<h3><?php esc_html_e( 'Administrator Tools', 'zero-bs-crm' ); ?></h3>
				<a href="<?php echo esc_url( wp_nonce_url( '?page=' . $zbs->slugs['systemstatus'] . '&tab=status&resetuserroles=1', 'resetuserroleszerobscrm' ) ); ?>" class="ui button blue"><?php esc_html_e( 'Re-build User Roles', 'zero-bs-crm' ); ?></a>
					<?php
					if ( $zbs->isDAL3() ) {
						?>
						<a href="<?php echo esc_url( zeroBSCRM_getAdminURL( $zbs->slugs['systemstatus'] ) . '&tab=status&v3migrationlog=1' ); ?>" class="ui button blue"><?php esc_html_e( 'v3 Migration Logs', 'zero-bs-crm' ); ?></a><?php } ?>
				</div>


				<script type="text/javascript">

				jQuery(function(){



				});


				</script>
			  
		</div>
		<?php

	} // / if normal page load
}
