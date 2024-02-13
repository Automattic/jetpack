<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 26/05/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */

class zeroBSCRM_list{

    private $objType = false;
    private $objTypeID = false; // Will be set in v3.0+ - is autogenned from $objType ^^
    private $singular = false;
    private $plural = false;
    private $tag = false;
    private $postType = false;
    private $postPage = false;
    private $langLabels = false;
    private $bulkActions = false;
    private $sortables = false;
    private $unsortables = false;
    private $extraBoxes = '';
    private $extraJS = '';
    private $messages = false;
        #} All messages need params to match this func: 
        #} ... zeroBSCRM_UI2_messageHTML($msgClass='',$msgHeader='',$msg='',$iconClass='',$id='')

	/**
	 * Construct function
	 *
	 * @param array $args Object construct args.
	 */
	public function __construct( $args = array() ) {

		$default_args = array(

			'objType'     => false, // transaction
			'singular'    => false, // Transaction
			'plural'      => false, // Transactions
			'tag'         => false, // zerobs_transactiontag
			'postType'    => false, // zerobs_transaction
			'postPage'    => false, // manage-transactions
			'langLabels'  => array(

				// bulk actions - general
				'view'                => __( 'View', 'zero-bs-crm' ),
				'edit'                => __( 'Edit', 'zero-bs-crm' ),
				'deletestr'           => __( 'Delete', 'zero-bs-crm' ),
				'nocustomer'          => __( 'Not Assigned', 'zero-bs-crm' ),
				'areyousure'          => __( 'Are you sure?', 'zero-bs-crm' ),
				'acceptyesdoit'       => __( 'Yes, accept', 'zero-bs-crm' ),
				'yesproceed'          => __( 'Yes, proceed', 'zero-bs-crm' ),
				'changestatus'        => __( 'Change Status', 'zero-bs-crm' ),
				'yesupdate'           => __( 'Yes, update', 'zero-bs-crm' ),

				// bulk actions - delete
				'areyousurethese'     => __( 'Are you sure you want to delete these?', 'zero-bs-crm' ),
				'yesdelete'           => __( 'Yes, delete!', 'zero-bs-crm' ),
				'noleave'             => __( 'No, leave them', 'zero-bs-crm' ),
				'yesthose'            => __( 'Yes, remove everything', 'zero-bs-crm' ),
				'deleted'             => __( 'Deleted', 'zero-bs-crm' ),
				'notdeleted'          => __( 'Could not delete!', 'zero-bs-crm' ),

				// tag related
				'addtags'             => __( 'Add tags', 'zero-bs-crm' ),
				'removetags'          => __( 'Remove tag(s)', 'zero-bs-crm' ),
				'whichtags'           => __( 'Which Tag(s)?', 'zero-bs-crm' ),
				'whichtagsadd'        => __( 'Which Tag(s) would you like to add?', 'zero-bs-crm' ),
				'whichtagsremove'     => __( 'Which Tag(s) would you like to remove?', 'zero-bs-crm' ),
				'addthesetags'        => __( 'Add Tags', 'zero-bs-crm' ),
				'tagsadded'           => __( 'Tags Added', 'zero-bs-crm' ),
				'tagsaddeddesc'       => __( 'Your tags have been successsfully added.', 'zero-bs-crm' ),
				'tagsnotadded'        => __( 'Tags Not Added', 'zero-bs-crm' ),
				'tagsnotaddeddesc'    => __( 'Your tags could not be added.', 'zero-bs-crm' ),
				'tagsnotselected'     => __( 'No Tags Selected', 'zero-bs-crm' ),
				'tagsnotselecteddesc' => __( 'You did not select any tags.', 'zero-bs-crm' ),
				'removethesetags'     => __( 'Remove Tags', 'zero-bs-crm' ),
				'tagsremoved'         => __( 'Tags Removed', 'zero-bs-crm' ),
				'tagsremoveddesc'     => __( 'Your tags have been successsfully removed.', 'zero-bs-crm' ),
				'tagsnotremoved'      => __( 'Tags Not Removed', 'zero-bs-crm' ),
				'tagsnotremoveddesc'  => __( 'Your tags could not be removed.', 'zero-bs-crm' ),
				'notags'              => __( 'You do not have any tags', 'zero-bs-crm' ),

				// bulk actions - merge 2 records
				'merged'              => __( 'Merged', 'zero-bs-crm' ),
				'notmerged'           => __( 'Not Merged', 'zero-bs-crm' ),
				'yesmerge'            => __( 'Yes, merge them', 'zero-bs-crm' ),

				// error handling
				'badperms'            => __( 'Invalid permissions', 'zero-bs-crm' ),
				'badperms_desc'       => __( 'You do not have permissions to make this change.', 'zero-bs-crm' ),

			),
			'bulkActions' => array(),
			'sortables'   => array( 'id' ),
			'unsortables' => array( 'tagged', 'editlink', 'phonelink', 'viewlink' ),
			'extraBoxes'  => '', // html for extra boxes e.g. upsells :)
			'extraJS'     => '',
			'messages'    => '',

			// not implemented 'hideSidebar' => false // ability to hard-hide sidebar

		);
		// phpcs:disable
		foreach ($default_args as $argK => $argV){ $this->$argK = $argV; if (is_array($args) && isset($args[$argK])) {  if (is_array($args[$argK])){ $newData = $this->$argK; if (!is_array($newData)) $newData = array(); foreach ($args[$argK] as $subK => $subV){ $newData[$subK] = $subV; }$this->$argK = $newData;} else { $this->$argK = $args[$argK]; } } }
		// phpcs:enable

		global $zbs;

		if ( $this->objTypeID == false ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual,WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			$this->objTypeID = $zbs->DAL->objTypeID( $this->objType ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		}
	}

    public function drawListView(){

        if (empty($this->objType) || empty($this->postType) || empty($this->postPage) || empty($this->singular) || empty($this->plural)){

            return 'Error.';
        }

        global $zbs;


        #} Retrieve all passed filters (tags, etc.)
        $listViewFilters = array(); if (isset($_GET['zbs_tag'])){

            $possibleTag = (int)sanitize_text_field($_GET['zbs_tag']);

			$possibleTagObj = $zbs->DAL->getTag( $possibleTag, array( 'objtype' => $this->objTypeID ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			if ( isset( $possibleTagObj['id'] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$listViewFilters['tags'] = array( $possibleTagObj ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			}
        }
        if (isset($_GET['s']) && !empty($_GET['s'])){

            $listViewFilters['s'] = sanitize_text_field($_GET['s']);

        }
        if (isset($_GET['quickfilters']) && !empty($_GET['quickfilters'])){

            // set it whether legit? what'll this do on error urls people make up?
            // v2.2+ hone this + add multi-filter
            // v2.99.5 - ALWAYS lowercase :) 
            $possibleQuickFilters = strtolower(sanitize_text_field($_GET['quickfilters']));
            $listViewFilters['quickfilters'] = array($possibleQuickFilters);

        }


        #} Paging
        $currentPage = 1; if (isset($_GET['paged'])) $currentPage = (int)sanitize_text_field($_GET['paged']);

        #} Sort
        $sort = false; if (isset($_GET['sort']) && !empty($_GET['sort'])) $sort = sanitize_text_field($_GET['sort']);
        $sortOrder = false; if (isset($_GET['sortdirection']) && ($_GET['sortdirection'] == 'asc' || $_GET['sortdirection'] == 'desc')) $sortOrder = sanitize_text_field($_GET['sortdirection']);


        # SCAFFOLDING - TO BE RE-ARRANGED :) 
        #} NOTE SECOND FIELD IN THESE ARE NOW IGNORED!?!? (30/7)

            #} Centralised into ZeroBSCRM.List.Columns.php 30/7/17
            $columnVar = 'zeroBSCRM_columns_'.$this->objType; //$zeroBSCRM_columns_transaction;
            $defaultColumns = $GLOBALS[ $columnVar ]['default'];
            $allColumns = $GLOBALS[ $columnVar ]['all'];


        global $zbs;
        $usingOwnership = $zbs->settings->get('perusercustomers');

        #} Retrieve columns settings
        $customViews = $zbs->settings->get('customviews2');

        $currentColumns = false; if (isset($customViews) && isset($customViews[$this->objType])) $currentColumns = $customViews[$this->objType];
        if ($currentColumns == false) $currentColumns = $defaultColumns;

		// add all columns to sortables :)
		if ( is_array( $currentColumns ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			foreach ( $currentColumns as $col => $var ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				if ( ! in_array( $col, $this->unsortables, true ) && ! in_array( $col, $this->sortables, true ) ) {
					$this->sortables[] = $col;
				}
			}
		}

		$screen_opts = $zbs->global_screen_options();

		if ( ! empty( $screen_opts['perpage'] ) && $screen_opts['perpage'] > 0 ) {
			$per_page = (int) $screen_opts['perpage'];
		} else {
			$per_page = 20;
		}

        #} Refresh 2
        ?>

            <!-- title + edit ico -->

            <!-- col editor -->
						<div id="zbs-list-col-editor" class="hidden">

                <h4 class="ui horizontal divider header">
                  <i class="list layout icon"></i>
                  <?php echo esc_html( sprintf(__('%s List View Options',"zero-bs-crm"),$this->singular) ); ?>
                </h4>
    
                <?php if (zeroBSCRM_isZBSAdminOrAdmin()){ // only admin can manage columns (globally) ?>
                <div id="zbs-list-view-options-wrap" class="ui divided grid">

                  <div class="ui active inverted dimmer hidden" id="zbs-col-manager-loading" style="display:none">
                    <div class="ui text loader"><?php esc_html_e('Loading',"zero-bs-crm");?></div>
                  </div>

                    <div class="row">
                        <div class="ten wide column">

                            <h4><?php esc_html_e('Current Columns',"zero-bs-crm"); ?></h4>


                            <div id="zbs-column-manager-current-cols" class="ui segment zbs-column-manager-connected"> 
                                <?php if (is_array($currentColumns)) foreach ($currentColumns as $colKey => $col){

                                    ?><div id="zbs-column-manager-col-<?php echo esc_attr( $colKey ); ?>" class="ui compact tiny basic button zbs-column-manager-col" data-key="<?php echo esc_attr( $colKey ); ?>"><?php esc_html_e($col[0],"zero-bs-crm"); ?></div><?php

                                } ?>
                            </div>

                        </div>
                        <div class="six wide column">

                            <h4><?php esc_html_e('Available Columns',"zero-bs-crm"); ?></h4>

                            <div id="zbs-column-manager-available-cols" class="ui segment"> 
                                <?php if (is_array($allColumns)) {

                                    // here we split them into groups, where there is. This allows a seperation of 'base fields' and compute fields (e.g. total value)
                                    $allColumnsSorted = array('basefields'=>array(),'other'=>array());
                                    $hasMultiColumnGroups = 0;

                                    foreach ($allColumns as $colKey => $col){

                                        if (!array_key_exists($colKey, $currentColumns)){

                                            // split em up
                                            if (isset($col[2]) && $col[2] == 'basefield'){
                                                $allColumnsSorted['basefields'][$colKey] = $col;
                                                $hasMultiColumnGroups = true;
                                            } else
                                                $allColumnsSorted['other'][$colKey] = $col;

                                        }

                                    }

                                    // now we put them out sequentially
                                    $colGroupCount = 0;
                                    foreach ($allColumnsSorted as $sortGroup => $columns){

                                        if (is_array($columns) && count($columns) > 0){

                                            // put out a grouper + title
                                            echo '<div>';

                                            if ($hasMultiColumnGroups){

                                                // header - <i class="list layout icon"></i>

                                                $title = ''; $extraStyles = '';
                                                switch ($sortGroup){

                                                    case 'basefields':
                                                        $title = __('Fields','zero-bs-crm');
                                                        break;

                                                    default: 
                                                        $title = __('Extra Fields','zero-bs-crm');
                                                        break;
                                                }

                                                if ($colGroupCount > 0) $extraStyles = 'margin-top: 1em;';

                                                if (!empty($title)) echo '<h4 class="ui horizontal divider header" style="'. esc_attr( $extraStyles ) .'">'. esc_html( $title ) .'</h4>';
                                            }

                                            echo '<div class="zbs-column-manager-connected">';

                                            foreach ($columns as $colKey => $col){

                                                if (!array_key_exists($colKey, $currentColumns)){
                                                    
                                                    ?><div id="zbs-column-manager-col-<?php echo esc_attr( $colKey ); ?>" class="ui compact tiny basic button zbs-column-manager-col" data-key="<?php echo esc_attr( $colKey ); ?>"><?php esc_html_e($col[0],"zero-bs-crm"); ?></div><?php

                                                }

                                            }

                                            echo '</div></div>';

                                            $colGroupCount++;
                                        }

                                    }

                                    // if NONE output, we need to always have smt to drop to, so put empty:
                                    if ($colGroupCount == 0){
                                        echo '<div class="zbs-column-manager-connected">';
                                        echo '</div>';
                                    }


                                } ?>
                            </div>

                        </div>
                    </div>
                </div>

                <div class="ui divider"></div>
                <?php } // if admin/can manage columns ?>

								<div id="zbs-list-options-base-wrap" class="ui grid">

									<div class="two column clearing centered row">
										<div class="column" style="max-width:364px;">
											<div class="ui labeled input">
												<div class="ui label"><i class="table icon"></i>  <?php esc_html_e( 'Records per page:', 'zero-bs-crm' ); ?></div>
												<input type="text" style="width:70px;" class="intOnly" id="zbs-screenoptions-records-per-page" value="<?php echo esc_attr( $per_page ); ?>" />
											</div>
										</div>
									</div>

									<div class="ui divider" style="margin-bottom:0;margin-top:0;"></div>

									<div class="two column clearing centered row">
										<div class="column" style="max-width:364px;">
											<button id="zbs-columnmanager-bottomsave" type="button" class="ui button black positive">
												<i class="check square icon"></i> <?php esc_html_e( 'Save Options and Close', 'zero-bs-crm' ); ?>
											</button>
										</div>
									</div>

								</div>


            </div>

			<div class="jpcrm-listview">
				<?php
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				$this->draw_listview_header( $listViewFilters );
				?>
				<div class="jpcrm-listview-table-container">
					<!-- Drawn by Javascript -->
				</div>
				<?php $this->draw_listview_footer(); ?>
				<div id="zbs-list-warnings-wrap">
					<?php
					// Preloaded error messages
					// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped,WordPress.WP.I18n.MissingTranslatorsComment,WordPress.WP.I18n.UnorderedPlaceholdersText
					echo zeroBSCRM_UI2_messageHTML( 'warning hidden', sprintf( __( 'Error retrieving %s', 'zero-bs-crm' ), $this->plural ), sprintf( __( 'There has been a problem retrieving your %s. If this issue persists, please contact support.', 'zero-bs-crm' ), $this->plural ), 'disabled warning sign', 'zbsCantLoadData' );
					echo zeroBSCRM_UI2_messageHTML( 'warning hidden', sprintf( __( 'Error updating columns %s', 'zero-bs-crm' ), $this->plural ), __( 'There has been a problem saving your column configuration. If this issue persists, please contact support.', 'zero-bs-crm' ), 'disabled warning sign', 'zbsCantSaveCols' );
					echo zeroBSCRM_UI2_messageHTML( 'warning hidden', sprintf( __( 'Error updating columns %s', 'zero-bs-crm' ), $this->plural ), __( 'There has been a problem saving your filter button configuration. If this issue persists, please contact support.', 'zero-bs-crm' ), 'disabled warning sign', 'zbsCantSaveButtons' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					echo zeroBSCRM_UI2_messageHTML( 'info hidden', sprintf( __( 'No %s Found', 'zero-bs-crm' ), $this->plural ), sprintf( __( 'There are no %s here. Do you want to <a href="%s">create one</a>?', 'zero-bs-crm' ), $this->plural, jpcrm_esc_link( 'create', -1, $this->postType ) ), 'disabled warning sign', 'zbsNoResults' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

					// any additional messages?
					if ( isset( $this->messages ) && is_array( $this->messages ) && count( $this->messages ) > 0 ) {
						foreach ( $this->messages as $message ) {
							// $message needs to match this func :)
							echo zeroBSCRM_UI2_messageHTML( $message[0], $message[1], $message[2], $message[3], $message[4] );
						}
					}
					// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped,WordPress.WP.I18n.MissingTranslatorsComment,WordPress.WP.I18n.UnorderedPlaceholdersText
					?>
				</div>
			</div>
			<?php

			// If totals, show the wrapper. Currently only implemented in contacts
			if ( $zbs->settings->get( 'show_totals_table' ) === 1 && $this->objType === 'customer' ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				?>
				<jpcrm-dashcount class="wide-cards"></jpcrm-dashcount>
				<?php
			}
			##WLREMOVE
			// e.g. upsell boxes
			echo $this->extraBoxes; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.Security.EscapeOutput.OutputNotEscaped
			##/WLREMOVE

			?>

        <script type="text/javascript">
					<?php
					// phpcs:disable Squiz.PHP.EmbeddedPhp.ContentBeforeOpen
					// phpcs:disable Squiz.PHP.EmbeddedPhp.ContentAfterEnd
					?>
            // expose log types (For columns)
            var zbsLogTypes = <?php global $zeroBSCRM_logTypes; echo json_encode($zeroBSCRM_logTypes); ?>;

            <?php

            $allowinlineedits = ( zeroBSCRM_getSetting('allowinlineedits') == "1" );
            $inlineEditStr = array();
            $columns = array();

            #} Current cols
            if ( is_array( $currentColumns ) ) {
	            foreach ( $currentColumns as $colKey => $col ) {

		            // set column title
		            $column_title = __($col[0],"zero-bs-crm");

		            // overrides

		            // Invoicing: Ref
		            if ( $this->objType == 'invoice' && $colKey == 'ref' ) {
			            $column_title = $zbs->settings->get('reflabel');
		            }

		            // can column be inline edited?
		            $inline = '-1';
		            if ( isset( $allColumns[$colKey] ) && isset( $allColumns[$colKey]['editinline'] ) && $allColumns[$colKey]['editinline'] ) {
			            $inline = '1';
		            }

		            $columns[] = array(
			            'namestr'  => esc_html( zeroBSCRM_slashOut($column_title,true) ),
			            'fieldstr' => esc_html( zeroBSCRM_slashOut($colKey,true) ),
			            'inline'   => (int) $inline,
		            );

		            $inlineEditStr[ $colKey ] = (int) $inline;
	            }
            }

            // build options objects
            $list_view_settings = array(

                'objdbname' => $this->objType,
                'search' => true,
                'filters' => true,
                'tags' => true,
                'c2c' => true,
                'editinline' => $allowinlineedits

            );

            $list_view_parameters = array(

                'listtype' => $this->objType,
                'columns' => $columns,
                'editinline' => $inlineEditStr,
                'retrieved' => false,
                'count' => (int)$per_page,
                'pagination' => true,
                'paged' => (int)$currentPage,

				// cast to object so an empty array is {} instead of [] when encoded as JSON
				'filters'    => (object) $listViewFilters, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
                'sort' => ( !empty( $sort ) ? esc_html( $sort ) : false ),
                'sortorder' => ( !empty( $sortOrder ) ?  esc_html( $sortOrder ) : 'desc' ),

                // expose page key (used to retrieve data with screen opts - perpage)
                'pagekey' => ( isset( $zbs->pageKey ) ? esc_html( $zbs->pageKey ) : '' ),

            );

            ?>

            // General options for listview
            var zbsListViewSettings = <?php echo wp_json_encode( $list_view_settings ) ?>;

            // Vars for zbs list view drawer
            var zbsListViewParams = <?php echo wp_json_encode( $list_view_parameters ) ?>;

            var zbsSortables = [<?php 

                $c = 0; if (count($this->sortables) > 0) foreach ($this->sortables as $sortableStr) {

                            if ($c > 0) echo ',';

                            echo "'". esc_html( $sortableStr ) ."'";

                            $c++;
                            
                } 

            ?>]; // for v2.2 this is only lot that will show sort, until we redo db this'll be hard
            var zbsBulkActions = [<?php $bulkCount = 0; if (count($this->bulkActions) > 0) foreach ($this->bulkActions as $bulkActionStr) {

                        if ($bulkCount > 0) echo ',';

                        echo "'". esc_html( $bulkActionStr ) ."'";

                        $bulkCount++;

            } ?>]; // :D
            var zbsListViewData = []; var zbsListViewCount = 0;
            var zbsDrawListViewBlocker = false;
            var zbsDrawListViewAJAXBlocker = false;
            var zbsDrawListViewColUpdateBlocker = false;
            var zbsDrawListViewColUpdateAJAXBlocker = false;

            var zbsObjectEmailLinkPrefix = '<?php 

                // this assumes is contact for now, just sends to prefill - perhaps later add mailto: optional (wh wants lol)
                echo jpcrm_esc_link( 'email',-1,'zerobs_customer',true );

            ?>';
            var zbsObjectViewLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'view',-1,'zerobs_customer',true ); ?>';
            var zbsObjectViewLinkPrefixCompany = '<?php echo jpcrm_esc_link( 'view',-1,'zerobs_company',true ); ?>';
            var zbsObjectViewLinkPrefixQuote = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_quote',true ); ?>';
            var zbsObjectViewLinkPrefixInvoice = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_invoice',true ); ?>';
            var zbsObjectViewLinkPrefixTransaction = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_transaction',true ); ?>';
            var zbsObjectViewLinkPrefixForm = '<?php echo jpcrm_esc_link( 'edit',-1,ZBS_TYPE_FORM,true ); ?>';
            var zbsObjectViewLinkPrefixSegment = '<?php echo jpcrm_esc_link( 'edit',-1,ZBS_TYPE_SEGMENT,true ); ?>';
            var zbsObjectViewLinkPrefixTask = '<?php echo jpcrm_esc_link( 'edit', -1, ZBS_TYPE_TASK, true  ); ?>';

            var zbsObjectEditLinkPrefixCustomer = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_customer',true ); ?>';
            var zbsObjectEditLinkPrefixCompany = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_company',true ); ?>';
            var zbsObjectEditLinkPrefixQuote = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_quote',true ); ?>';
            var zbsObjectEditLinkPrefixQuoteTemplate = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_quo_template',true ); ?>';
            var zbsObjectEditLinkPrefixInvoice = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_invoice',true ); ?>';
            var zbsObjectEditLinkPrefixTransaction = '<?php echo jpcrm_esc_link( 'edit',-1,'zerobs_transaction',true ); ?>';
            var zbsObjectEditLinkPrefixForm = '<?php echo jpcrm_esc_link( 'edit',-1,ZBS_TYPE_FORM,true ); ?>';
            var zbsObjectEditLinkPrefixSegment = '<?php echo jpcrm_esc_link( 'edit',-1,ZBS_TYPE_SEGMENT,true ); ?>';

            var jpcrm_segment_export_url_prefix = '<?php echo jpcrm_esc_link( $zbs->slugs['export-tools'] . '&segment-id=' ); ?>';

						var zbsListViewLink = '<?php echo esc_url( admin_url( 'admin.php?page=' . $this->postPage ) ); /* phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase */ ?>';
            var zbsExportPostURL = '<?php echo esc_url( zeroBSCRM_getAdminURL($zbs->slugs['export-tools']) ); ?>';
						var zbsTagSkipLinkPrefix = zbsListViewLink + '&zbs_tag=';
            var zbsListViewObjName = '<?php

                switch ($this->postType){


                    case 'zerobs_customer':
                        zeroBSCRM_slashOut(__('Contact',"zero-bs-crm"));
                        break;

                    case 'zerobs_company':
                        zeroBSCRM_slashOut(jpcrm_label_company());
                        break;

                    case 'zerobs_quote':
                        zeroBSCRM_slashOut(__('Quote',"zero-bs-crm"));
                        break;

                    case 'zerobs_invoice':
                        zeroBSCRM_slashOut(__('Invoice',"zero-bs-crm"));
                        break;

                    case 'zerobs_transaction':
                        zeroBSCRM_slashOut(__('Transaction',"zero-bs-crm"));
                        break;

                    case 'zerobs_form':
                        zeroBSCRM_slashOut(__('Form',"zero-bs-crm"));
                        break;

                    case 'zerobs_quotetemplate':
                        zeroBSCRM_slashOut(__('Quote Template',"zero-bs-crm"));
                        break;

                    default:
                        zeroBSCRM_slashOut(__('Item',"zero-bs-crm"));
                        break;



                } 

            ?>';
            var zbsClick2CallType = parseInt('<?php echo esc_url( zeroBSCRM_getSetting('clicktocalltype') ); ?>');

			<?php
			$jpcrm_listview_lang_labels = array();

			// add any object-specific language labels
			if ( count( $this->langLabels ) > 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				$jpcrm_listview_lang_labels = array_merge( $jpcrm_listview_lang_labels, $this->langLabels ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			}
			?>
			var zbsListViewLangLabels = <?php echo wp_json_encode( $jpcrm_listview_lang_labels ); ?>;
			var zbsTagsForBulkActions = <?php
				// the linter was having issues with these indents, so disabling for this block
				// phpcs:disable Generic.WhiteSpace.ScopeIndent.IncorrectExact,Generic.WhiteSpace.ScopeIndent.Incorrect
				$tags = $zbs->DAL->getTagsForObjType( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					array(
						'objtypeid'    => $this->objTypeID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
						'withCount'    => true,
						'excludeEmpty' => false,
						'ignoreowner'  => true,
					)
				);

				// make simplified
				$simple_tags = array();
				if ( is_array( $tags ) && count( $tags ) > 0 ) {
					foreach ( $tags as $t ) {
						$simple_tags[] = array(
							'id'   => $t['id'],
							'name' => $t['name'],
							'slug' => $t['slug'],
						);
					}
				}

				$zbs_tags_for_bulk_actions = wp_json_encode( $simple_tags );
				echo ( $zbs_tags_for_bulk_actions ? $zbs_tags_for_bulk_actions : '[]' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

				?>;
				var zbsListViewIcos = {};
				// gives data used by inline editor
				var zbsListViewInlineEdit = {

					// for now just put contacts in here
					customer: {
						statuses: <?php
							// MUST be a better way than this to get customer statuses...
							// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							global $zbsCustomerFields;
							if ( is_array( $zbsCustomerFields['status'][3] ) ) {
								echo wp_json_encode( $zbsCustomerFields['status'][3] );
							} else {
								echo '[]';
							}
							// phpcs:enable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
						?>
					},

					owners: <?php

						// hardcoded customer perms atm
						$possible_owners = zeroBS_getPossibleOwners( array( 'zerobs_admin', 'zerobs_customermgr' ), true );
						if ( ! is_array( $possible_owners ) ) {
								echo wp_json_encode( array() );
						} else {
							echo wp_json_encode( $possible_owners );
						}

					?>

					};
					<?php
					// Nonce for AJAX
					echo 'var zbscrmjs_secToken = "' . esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ) . '";';

					// any last JS?
					if ( isset( $this->extraJS ) && ! empty( $this->extraJS ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
						echo $this->extraJS; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase,WordPress.Security.EscapeOutput.OutputNotEscaped
					}
					// phpcs:enable Generic.WhiteSpace.ScopeIndent.IncorrectExact,Generic.WhiteSpace.ScopeIndent.Incorrect
					?>
					</script>

					<?php
					// phpcs:enable Squiz.PHP.EmbeddedPhp.ContentBeforeOpen
					// phpcs:enable Squiz.PHP.EmbeddedPhp.ContentAfterEnd

    } // /draw func

	/**
	 * Draws listview header that contains search, bulk actions, and filter dropdowns
	 *
	 * @param array $listview_filters Array of current listview filters.
	 */
	public function draw_listview_header( $listview_filters ) {
		global $zbs;

		$filter_var       = 'zeroBSCRM_filterbuttons_' . $this->objType; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$all_quickfilters = ( empty( $GLOBALS[ $filter_var ]['all'] ) ? array() : $GLOBALS[ $filter_var ]['all'] );
		$all_tags         = $zbs->DAL->getTagsForObjType( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'objtypeid'    => $this->objTypeID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'excludeEmpty' => false,
			)
		);

		$current_quickfilter       = ( ! empty( $listview_filters['quickfilters'][0] ) ? $listview_filters['quickfilters'][0] : '' );
		$current_quickfilter_label = ( ! empty( $all_quickfilters[ $current_quickfilter ][0] ) ? $all_quickfilters[ $current_quickfilter ][0] : '' );
		$current_tag               = ( ! empty( $listview_filters['tags'][0] ) ? $listview_filters['tags'][0]['name'] : '' );
		$current_search            = ( ! empty( $listview_filters['s'] ) ? $listview_filters['s'] : '' );
		?>

		<jpcrm-listview-header id="jpcrm-listview-header">
			<header-item>
				<input type="search"  value="<?php echo esc_attr( $current_search ); ?>" placeholder="<?php echo esc_attr__( 'Search...', 'zero-bs-crm' ); ?>" autocomplete="<?php echo esc_attr( jpcrm_disable_browser_autocomplete() ); ?>"/>
				<select class="bulk-actions-dropdown hidden">
					<option><?php echo esc_html__( 'Bulk actions (no rows)', 'zero-bs-crm' ); ?></option>
				</select>
			</header-item>
			<header-item>
				<?php
				// add quickfilters filter if current object has quickfilters
				if ( count( $all_quickfilters ) > 0 ) {
					echo '<select class="filter-dropdown' . ( ! empty( $current_quickfilter_label ) ? ' hidden' : '' ) . '" data-filtertype="quickfilters">';
					echo '<option disabled selected>' . esc_html__( 'Select filter', 'zero-bs-crm' ) . '</option>';
					foreach ( $all_quickfilters as $filter_slug => $filter_data ) {
						echo '<option value="' . esc_attr( $filter_slug ) . '">' . esc_html( $filter_data[0] ) . '</option>';
					}
					echo '</select>';
					echo '<div class="jpcrm-current-filter' . ( empty( $current_quickfilter_label ) ? ' hidden' : '' ) . '">';
					echo '<button class="dashicons dashicons-remove" title="' . esc_attr__( 'Remove filter', 'zero-bs-crm' ) . '"></button>';
					echo esc_html__( 'Filter', 'zero-bs-crm' ) . ': ';
					echo '<span>' . esc_html( $current_quickfilter_label ) . '</span>';
					echo '</div>';
				}

				// add tags filter if current object has tags
				if ( is_array( $all_tags ) && count( $all_tags ) > 0 ) {
					echo '<select class="filter-dropdown' . ( ! empty( $current_tag ) ? ' hidden' : '' ) . '" data-filtertype="tags">';
					echo '<option disabled selected>' . esc_html__( 'Select tag', 'zero-bs-crm' ) . '</option>';
					foreach ( $all_tags as $tag ) {
						echo '<option value="' . esc_attr( $tag['id'] ) . '">' . esc_html( $tag['name'] ) . '</option>';
					}
					echo '</select>';
					echo '<div class="jpcrm-current-filter' . ( empty( $current_tag ) ? ' hidden' : '' ) . '">';
					echo '<button class="dashicons dashicons-remove" title="' . esc_attr__( 'Remove tag', 'zero-bs-crm' ) . '"></button>';
					echo esc_html__( 'Tag', 'zero-bs-crm' ) . ': ';
					echo '<span>' . esc_html( $current_tag ) . '</span>';
					echo '</div>';
				}
				?>
			</header-item>
		</jpcrm-listview-header>
		<?php
	}

	/**
	 * Draws a listview footer and its containers for JS to use
	 */
	public function draw_listview_footer() {
		?>
		<jpcrm-listview-footer>
			<footer-left>
				<div class= "jpcrm-listview-counts-container">
					<!-- drawn by JS -->
				</div>
			</footer-left>
			<footer-right>
				<div class= "jpcrm-pagination-container">
					<!-- drawn by JS -->
				</div>
			</footer-right>
		</jpcrm-listview-footer>
		<?php
	}
} // class

/**
 * Language labels for JS
 *
 * @param array $language_array Array of language labels.
 */
function jpcrm_listview_language_labels( $language_array ) { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	$jpcrm_listview_lang_labels = array(
		'click_to_sort'      => esc_html__( 'Click to sort', 'zero-bs-crm' ),
		/* translators: Placeholder is the number of selected rows. */
		'rows_selected_x'    => esc_html__( 'Bulk actions (%s rows)', 'zero-bs-crm' ),
		'rows_selected_1'    => esc_html__( 'Bulk actions (1 row)', 'zero-bs-crm' ),
		'rows_selected_0'    => esc_html__( 'Bulk actions (no rows)', 'zero-bs-crm' ),
		'zbs_edit'           => esc_html__( 'Edit', 'zero-bs-crm' ),
		'today'              => esc_html__( 'Today', 'zero-bs-crm' ),
		'daysago'            => esc_html__( 'days ago', 'zero-bs-crm' ),
		'notcontacted'       => esc_html__( 'Not Contacted', 'zero-bs-crm' ),
		'yesterday'          => esc_html__( 'Yesterday', 'zero-bs-crm' ),
		'couldntupdate'      => esc_html__( 'Could not update', 'zero-bs-crm' ),
		'couldntupdatedeets' => esc_html__( 'This record could not be updated. Please try again, if this persists please let admin know.', 'zero-bs-crm' ),
		/* translators: Placeholders are the range of the current record result and the total object count. */
		'listview_counts'    => esc_html__( 'Showing %s of %s items', 'zero-bs-crm' ), // phpcs:ignore WordPress.WP.I18n.UnorderedPlaceholdersText
	);

	return array_merge( $language_array, $jpcrm_listview_lang_labels );
}
add_filter( 'zbs_globaljs_lang', 'jpcrm_listview_language_labels' );
