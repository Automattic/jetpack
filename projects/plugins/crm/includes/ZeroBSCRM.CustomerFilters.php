<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

/*
======================================================
Customer Typeaheads
	====================================================== */

	// } Outputs the html for a customer type-ahead list
function zeroBSCRM_CustomerTypeList( $jsCallbackFuncStr = '', $inputDefaultValue = '', $showFullWidthSmaller = false, $jsChangeCallbackFuncStr = '' ) {

	$ret          = '';
	$extraClasses = '';

	if ( $showFullWidthSmaller ) {
		$extraClasses .= 'zbsbtypeaheadfullwidth';
	}

		// } Wrap
		$ret .= '<div class="zbstypeaheadwrap ' . $extraClasses . '">';

		// } Build input
		$ret .= '<input class="zbstypeahead" type="text" value="' . esc_attr( $inputDefaultValue ) . '" placeholder="' . __( 'Contact name or email...', 'zero-bs-crm' ) . '" data-zbsopencallback="' . $jsCallbackFuncStr . '" data-zbschangecallback="' . $jsChangeCallbackFuncStr . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" data-autokey="cotypelist">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		// } close wrap
		$ret .= '</div>';

		// } Also need to make sure this is dumped out for js
		global $haszbscrmBHURLCustomersOut;
	if ( ! isset( $haszbscrmBHURLCustomersOut ) ) {

		// cachebusting for now... (ESP needed when migrating from DAL1 -> DAL2)

		$cacheBusterStr = '&time=' . time();

		// change to proper WP REST (not cached) and wont be impacted by setup connection issues. Is also the "proper" way to do it
		$nonce                      = wp_create_nonce( 'wp_rest' );
		$rest_url                   = esc_url( get_rest_url() . 'zbscrm/v1/contacts?_wpnonce=' . $nonce );
		$ret                       .= '<script type="text/javascript">var zbscrmBHURLCustomers = "' . $rest_url . '";</script>';
		$haszbscrmBHURLCustomersOut = true;
	}

		// } Global JS does the rest ;)
		// } see zbscrm_JS_Bind_Typeaheads_Customers

		return $ret;
}

	// } Outputs the html for a Company type-ahead list
function zeroBSCRM_CompanyTypeList( $jsCallbackFuncStr = '', $inputDefaultValue = '', $showFullWidthSmaller = false, $jsChangeCallbackFuncStr = '' ) {

	$ret          = '';
	$extraClasses = '';

	if ( $showFullWidthSmaller ) {
		$extraClasses .= 'zbsbtypeaheadfullwidth';
	}

	// typeahead or select?
	// turned off until JS bind's work
	// #TODOCOLIST in /wdev/ZeroBSCRM/zerobs-core/js/ZeroBSCRM.admin.global.js
	if ( isset( $neverGoingToBeSet ) && zeroBS_companyCount() < 50 ) {

		// } Wrap
		$ret .= '<div class="zbs-company-select ' . $extraClasses . '">';

		// } Build input
		$companies = zeroBS_getCompanies( true, 10000, 0 );
		$ret      .= '<select class="zbs-company-select-input" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" data-zbsopencallback="' . $jsCallbackFuncStr . '" data-zbschangecallback="' . $jsChangeCallbackFuncStr . '">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		if ( is_array( $companies ) ) {
			foreach ( $companies as $co ) {

				if ( isset( $co['name'] ) && $co['name'] !== 'Auto Draft' ) {

					$ret .= '<option value="' . $co['id'] . '"';
					if ( $co['name'] == $inputDefaultValue ) {
						$ret .= ' selected="selected"';
					}
					$ret .= '>' . esc_html( $co['name'] ) . '</option>';

				}
			}
		}

			$ret .= '</select>';

			// } close wrap
			$ret .= '</div>';

	} else {

		// typeahead

		// } Wrap
		$ret .= '<div class="zbstypeaheadwrap ' . $extraClasses . '">';

		$ret .= '<input class="zbstypeaheadco" type="text" value="' . $inputDefaultValue . '" placeholder="' . __( jpcrm_label_company() . ' name...', 'zero-bs-crm' ) . '" data-zbsopencallback="' . $jsCallbackFuncStr . '" data-zbschangecallback="' . $jsChangeCallbackFuncStr . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" data-autokey="cotypelist">'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase,WordPress.WP.I18n.NonSingularStringLiteralText

		// } close wrap
		$ret .= '</div>';

		// } Also need to make sure this is dumped out for js
		global $haszbscrmBHURLCompaniesOut;
		if ( ! isset( $haszbscrmBHURLCompaniesOut ) ) {

			$nonce                      = wp_create_nonce( 'wp_rest' );
			$rest_url                   = esc_url( get_rest_url() . 'zbscrm/v1/companies?_wpnonce=' . $nonce );
			$ret                       .= '<script type="text/javascript">var zbscrmBHURLCompanies = "' . $rest_url . '";</script>';
			$haszbscrmBHURLCompaniesOut = true;
		}

		// } Global JS does the rest ;)
		// } see zbscrm_JS_Bind_Typeaheads_Customers

	}

	return $ret;
}

	// WH NOTE: WHY is this getting ALL of them and not s? param
	// } Returns json representing the first 10k customers in db... brutal
	// } MS NOTE: useful to return EMAIL in the response (for auto filling - WITHOUT getting ALL meta)?
function zeroBSCRM_cjson() {

	header( 'Content-Type: application/json' );
	$ret = array();

	if ( is_user_logged_in() && zeroBSCRM_permsCustomers() ) {

		$ret = zeroBS_getCustomers( true, 10000, 0, false, false, '', false, false, false );

		// quickfix (not req DAL2)
		global $zbs;
		if ( ! $zbs->isDAL2() ) {

			$retA = array();
			foreach ( $ret as $r ) {
				if ( isset( $r['name'] ) && $r['name'] !== 'Auto Draft' ) {
					$retA[] = $r;
				}
			}

			$ret = $retA;
			unset( $retA );
		}
	}

	echo json_encode( $ret );

	exit();
}

	// WH NOTE: WHY is this getting ALL of them and not s? param
	// } Returns json representing the first 10k customers in db... brutal
function zeroBSCRM_cojson() {

	header( 'Content-Type: application/json' );
	$ret = array();

	if ( is_user_logged_in() && zeroBSCRM_permsCustomers() ) {

		// $ret = zeroBS_getCustomers(false,10000,0,false,false,'',false,false,false);
		$ret = zeroBS_getCompanies( true, 10000, 0 );

		// quickfix required until we move co to dal2
		// if (!$zbs->isDAL2()){

			$retA = array();
		foreach ( $ret as $r ) {
			if ( isset( $r['name'] ) && $r['name'] !== 'Auto Draft' ) {
				$retA[] = $r;
			}
		}

			$ret = $retA;
		unset( $retA );
			// }

	}

	echo json_encode( $ret );

	exit();
}

/*
======================================================
	/ Customer Typeaheads
	====================================================== */

/*
======================================================
	Customer Filter Funcs
	====================================================== */

function zbs_customerFiltersGetApplied( $srcArr = 'usepost', $requireEmail = false ) {

	$fieldPrefix = '';

	global $zbs;

	// } Can't use post as a default, so...
	if ( is_string( $srcArr ) && $srcArr == 'usepost' ) {
		$srcArr = $_POST;
		// } Also, posted fields need this prefix
		$fieldPrefix = 'zbs-crm-customerfilter-';

		$fromPost = true;
	}

	// } Req.
	global $zbsCustomerFields, $zbsCustomerFiltersInEffect, $zbsCustomerFiltersPosted;
	$allZBSTags = zeroBS_integrations_getAllCategories();

	// } start
	$appliedFilters = array();
	$activeFilters  = 0;

	/*
		status (str)
		namestr (str)
		source (str) linked to cf1
		valuefrom
		valueto
		addedfrom
		addedto

			zbs-crm-customerfilter-tag-'.$tagGroupKey.'-'.$tag->term_id

		hasquote (bool int)
		hasinv (bool int)
		hastransact (bool int)

		postcode (str)

		To add:

			#} modifiedfromtoo
			#} External source/id (LATER)


	*/

		// } process filters
		$possibleFilters = array(

			// } key => array(type, matching field(notyetused))
			'status'      => array( 'str', 'status' ),
			'namestr'     => array( 'str', 'custom:fullname' ),
			'source'      => array( 'str', 'cf1' ),
			'valuefrom'   => array( 'float', 'custom:totalval' ),
			'valueto'     => array( 'float', 'custom:totalval' ),
			'addedrange'  => array( 'str', '' ), // x - y (dates)
			// } these will be added by func below
			// 'addedfrom' => array('str',''),
			// 'addedto' => array('str',''),
			'hasquote'    => array( 'bool', '' ),
			'hasinv'      => array( 'bool', '' ),
			'hastransact' => array( 'bool', '' ),
			'postcode'    => array( 'str', 'postcode' ),

		);
		// } Tags dealt with seperately.

		foreach ( $possibleFilters as $key => $filter ) {

			$type = $filter[0];

			if ( isset( $srcArr[ $fieldPrefix . $key ] ) ) {

				switch ( $type ) {

					case 'str':
						// } Is it a str? cleanse?
						if ( ! empty( $srcArr[ $fieldPrefix . $key ] ) ) {

							// } add
							$appliedFilters[ $key ] = sanitize_text_field( $srcArr[ $fieldPrefix . $key ] );
							++$activeFilters;
						}

						break;

					case 'float':
						// } Is it a no? cleanse?
						if ( ! empty( $srcArr[ $fieldPrefix . $key ] ) ) {

							// } Cast
							$no = (float) sanitize_text_field( $srcArr[ $fieldPrefix . $key ] );

							// } add
							$appliedFilters[ $key ] = $no;
							++$activeFilters;
						}

						break;

					case 'int':
						// } Is it a no? cleanse?
						if ( ! empty( $srcArr[ $fieldPrefix . $key ] ) ) {

							// } Cast
							$no = (int) sanitize_text_field( $srcArr[ $fieldPrefix . $key ] );

							// } add
							$appliedFilters[ $key ] = $no;
							++$activeFilters;
						}

						break;

					case 'bool':
						// } Is it a bool? cleanse?
						// } double check? no need...
						// } made a hack bool here - is either:
							// } empty (not set)
							// } 1 = true
							// } -1 = false
						if ( isset( $srcArr[ $fieldPrefix . $key ] ) ) {

							if ( $srcArr[ $fieldPrefix . $key ] == '1' ) {

								// } add
								$appliedFilters[ $key ] = true;
								++$activeFilters;

							} elseif ( $srcArr[ $fieldPrefix . $key ] == '-1' ) {

								// } add
								$appliedFilters[ $key ] = false;
								++$activeFilters;

							}
						}

						break;

				}
			}
		} // / foreach

		// } Added date range
		if ( isset( $appliedFilters['addedrange'] ) && ! empty( $appliedFilters['addedrange'] ) ) {

			// } Try split
			if ( strpos( $appliedFilters['addedrange'], '-' ) > 0 ) {

				$dateParts = explode( ' - ', $appliedFilters['addedrange'] );
				if ( count( $dateParts ) == 2 ) {

					// } No validation here (yet)
					if ( ! empty( $dateParts[0] ) ) {
						$appliedFilters['addedfrom'] = $dateParts[0];
						++$activeFilters;
					}
					if ( ! empty( $dateParts[1] ) ) {
						$appliedFilters['addedto'] = $dateParts[1];
						++$activeFilters;
					}
				}
			}
		}

		// } Tags (From POST)
		if ( isset( $fromPost ) ) {
			$appliedFilters['tags'] = array();
			if ( isset( $allZBSTags ) && count( $allZBSTags ) > 0 ) {

				// } Cycle through + catch active
				foreach ( $allZBSTags as $tagGroupKey => $tagGroup ) {

					if ( count( $tagGroup ) > 0 ) {
						foreach ( $tagGroup as $tag ) {

							// DAL support
							$tagID   = -1;
							$tagName = '';
							if ( $zbs->isDAL2() ) {

								$tagID   = $tag['id'];
								$tagName = $tag['name'];

							} else {

								$tagID   = $tag->term_id;
								$tagName = $tag->name;

							}

							// } set?
							if ( isset( $_POST[ 'zbs-crm-customerfilter-tag-' . $tagGroupKey . '-' . $tagID ] ) ) {

								// } Tagged :) Add
								$appliedFilters['tags'][ $tagGroupKey ][ $tagID ] = true;
								++$activeFilters;

							}
						}
					}
				}
			}
		} else {

			// } From passed array, so just make sure it's an array of arrays and pass :)
			// } This all assumes passing a json obj made into array with (array) cast (see mail camp search #tempfilterjsonpass)
			$appliedFilters['tags'] = array();

			if ( isset( $srcArr['tags'] ) ) {

				$srcTags = (array) $srcArr['tags'];

				if ( is_array( $srcTags ) && count( $srcTags ) > 0 ) {
					foreach ( $srcTags as $tagKey => $tagObj ) {

						$appliedFilters['tags'][ $tagKey ] = (array) $tagObj;

					}
				}
			}
		}

		// } if req email
		if (
			$requireEmail ||
			( isset( $srcArr[ $fieldPrefix . 'require-email' ] ) && ! empty( $srcArr[ $fieldPrefix . 'require-email' ] ) )
			) {
			$appliedFilters['require_email'] = true;
		}

		// } this will only be set if filters have been posted/some actually apply:
		// } $zbsCustomerFiltersPosted;
		if ( $activeFilters > 0 ) {
			$zbsCustomerFiltersPosted = $activeFilters;
		}

		return $appliedFilters;
}

/*
	zbs_customerFiltersRetrieveCustomers
	#} Retrieves array of customers filtered by zbs_customerFilters

	#} Notes:
		- This can + will be fired by zeroBS__customerFiltersRetrieveCustomerCount if that is fired BEFORE THIS
		.. Thereafter it'll use a cached list (and apply paging) - unless $forceRefresh is set to true

*/
function zbs_customerFiltersRetrieveCustomers( $perPage = 10, $page = 1, $forcePaging = false, $forceRefresh = false ) {

	// } Query Performance index
	// global $zbsQPI; if (!isset($zbsQPI)) $zbsQPI = array();
	// $zbsQPI['retrieveCustomers1'] = zeroBSCRM_mtime_float();

	// } Req.
	global $zbs,$zbsCustomerFields, $zbsCustomerFiltersInEffect, $zbsCustomerFiltersCurrentList;

	// } Already cached?
	if (
		// } Already cached - yep + force refresh
		( isset( $zbsCustomerFiltersCurrentList ) && is_array( $zbsCustomerFiltersCurrentList ) && $forceRefresh ) ||
		// } Not cached
		( ! isset( $zbsCustomerFiltersCurrentList ) || ! is_array( $zbsCustomerFiltersCurrentList ) )
		) {

		// DEBUG echo 'NOT CACHED: zbs_customerFiltersRetrieveCustomers<br />';

			// } Any applied filters will be here: $zbsCustomerFiltersInEffect
			$appliedFilters = array();

			// } No validation here
		if ( isset( $zbsCustomerFiltersInEffect ) && is_array( $zbsCustomerFiltersInEffect ) && count( $zbsCustomerFiltersInEffect ) > 0 ) {
			$appliedFilters = $zbsCustomerFiltersInEffect;
		}

			// } Output

				// } First build query

					// } PAGING NOTE:
						// } MOVED TO POST retrieve, to allow for counts to be made :)
						// } MVP... search #postpaging
						// } Note $forcePaging FORCES pre-paging
							// } Page legit? - lazy check
		if ( $forcePaging ) {

			if ( $perPage < 0 ) {
				$perPageArg = 10;
			} else {
				$perPageArg = (int) $perPage;
			}
		} else {

			$perPageArg = 10000; // } lol.

		}

					// } Defaults
					$args = array(
						'post_type'      => 'zerobs_customer',
						'post_status'    => 'publish',
						'posts_per_page' => $perPageArg,
						'order'          => 'DESC',
						'orderby'        => 'post_date',
					);

					if ( $forcePaging ) {
						// } Add page if page... - dodgy meh
						$actualPage = $page - 1;
						if ( $actualPage < 0 ) {
							$actualPage = 0;
						}
						if ( $actualPage > 0 ) {
							$args['offset'] = $perPageArg * $actualPage;
						}
					}

					// DAL 2 support :)
					$dal2Args = array(
						'perPage'          => $perPageArg,
						'sortByField'      => 'zbsc_created',
						'sortOrder'        => 'DESC',
						'ignoreowner'      => true,
						'withQuotes'       => true,
						'withInvoices'     => true,
						'withTransactions' => true,
					);

					// } This is brutal, and needs rethinking #v1.2
					// } For now, is split into two sections
						// 1) Can be queried via wp_post args
						// 2) Can't be... (filtered post query...)
					// } Inefficient, but for launch...

					// } ===============================================================
					// } get_posts queriable attrs
					// } ===============================================================

					// } Name
						// } As of v1.1
						// 'name' =>  $customerEle->post_title
					if ( isset( $appliedFilters['namestr'] ) && ! empty( $appliedFilters['namestr'] ) ) {

						// } Simples
						$args['s'] = $appliedFilters['namestr'];

						// DAL2
						$dal2Args['searchPhrase'] = $appliedFilters['namestr'];

					}

					// } Added From + To

						// 'created' => $customerEle->post_date_gmt OR post_modified_gmt for modified
					if ( isset( $appliedFilters['addedfrom'] ) && ! empty( $appliedFilters['addedfrom'] ) ) {

						// } add holder if req
						if ( ! isset( $args['date_query'] ) ) {
							$args['date_query'] = array();
						}

						// } Add
						$args['date_query'][] = array(
							'column' => 'post_date_gmt',
							'after'  => $appliedFilters['addedfrom'],
						);

						// DAL2
						// TBC $dal2Args['searchPhrase'] = $appliedFilters['namestr'];

					}
					if ( isset( $appliedFilters['addedto'] ) && ! empty( $appliedFilters['addedto'] ) ) {

						// } add holder if req
						if ( ! isset( $args['date_query'] ) ) {
							$args['date_query'] = array();
						}

						// } Add
						$args['date_query'][] = array(
							'column' => 'post_date_gmt',
							'before' => $appliedFilters['addedto'],
						);

						// DAL2
						// TBC $dal2Args['searchPhrase'] = $appliedFilters['namestr'];

					}

					// } Tags
					if ( isset( $appliedFilters['tags'] ) && is_array( $appliedFilters['tags'] ) && count( $appliedFilters['tags'] ) > 0 ) {

						// } Temp holder
						$tagQueryArrays = array();

						// DAL2 - ignoring taxonomy here
						$tagIDS = array();

						// } Foreach taxonomy type:
						foreach ( $appliedFilters['tags'] as $taxonomyKey => $tagItem ) {

							$thisTaxonomyArr = array();

							// } Foreach tag in taxonomy
							foreach ( $tagItem as $tagID => $activeFlag ) {

								// } If logged here, is active, disregard $activeFlag
								$thisTaxonomyArr[] = $tagID;

								// dal2
								$tagIDS[] = $tagID;

							}

							if ( count( $thisTaxonomyArr ) > 0 ) {

								// } Add it
								$tagQueryArrays[] = array(
									'taxonomy' => $taxonomyKey,
									'field'    => 'term_id',
									'terms'    => $thisTaxonomyArr,
								);

							}

							/*
								#} Later for "not in"
								'terms'    => array( 103, 115, 206 ),
								'operator' => 'NOT IN',

							*/

						}

						// } Any to add?
						if ( count( $tagQueryArrays ) > 0 ) {

								// } Set
								$args['tax_query'] = array();

								// } if multiple, needs this
							if ( count( $tagQueryArrays ) > 1 ) {

								$args['tax_query']['relation'] = 'AND';

							}

								// } Add em all :)
							foreach ( $tagQueryArrays as $tqArr ) {
								$args['tax_query'][] = $tqArr;
							}
						}

						// DAL2
						if ( count( $tagIDS ) > 0 ) {
							$dal2Args['isTagged'] = $tagIDS;
						}
					}

					// } ===============================================================
					// } / end of get_posts queriable attrs
					// } ===============================================================

					// Debug echo '<h2>ARGS</h2><pre>'; print_r($args); echo '</pre>';

					// } QPI
					// $zbsQPI['retrieveCustomers1'] = round(zeroBSCRM_mtime_float() - #$zbsQPI['retrieveCustomers1'],2).'s';
					// $zbsQPI['retrieveCustomers2'] = zeroBSCRM_mtime_float();

					// } Run query
					// $potentialCustomerList = get_posts( $args );
					if ( $zbs->isDAL2() ) {

						$potentialCustomerList = $zbs->DAL->contacts->getContacts( $dal2Args );

					} else {

						// DAL1
						$potentialCustomerList = zeroBS_getCustomers( true, 10, 0, true, true, '', true, $args );

					}
					// $endingCustomerList = zeroBS_getCustomers(true,10,0,true,true,'',true,$args);
					$endingCustomerList = array();

					// } QPI
					// $zbsQPI['retrieveCustomers2'] = round(zeroBSCRM_mtime_float() - #$zbsQPI['retrieveCustomers2'],2).'s';
					// $zbsQPI['retrieveCustomers3'] = zeroBSCRM_mtime_float();

					// } ===============================================================
					// } filter post-query
					// } ===============================================================
					$x = 0;
					if ( count( $potentialCustomerList ) > 0 ) {
						foreach ( $potentialCustomerList as $potentialCustomer ) {

							// } Innocent until proven...
							$includeThisCustomer = true;

							// } Stops excess queries
							// $botheredAboutQuotes = false; if (isset($appliedFilters['hasquote']) && $appliedFilters['hasquote']) $botheredAboutQuotes = true;
							// $botheredAboutInvs = false; if (isset($appliedFilters['hasinv']) && $appliedFilters['hasinv']) $botheredAboutInvs = true;
							// $botheredAboutTransactions = false; if (isset($appliedFilters['hastransact']) && $appliedFilters['hastransact']) $botheredAboutTransactions = true;
							// } Need them all, whatever, for total value etc.
							$botheredAboutQuotes       = true;
							$botheredAboutInvs         = true;
							$botheredAboutTransactions = true;

							// } Retrieve full cust
							// $fullCustomer = zeroBS_getCustomer($potentialCustomer->ID,$botheredAboutQuotes,$botheredAboutInvs,$botheredAboutTransactions);
							// } Optimised away from this :)
							$fullCustomer = $potentialCustomer;

							// } Require email?
							if ( isset( $appliedFilters['require_email'] ) ) {

								if ( ! zeroBSCRM_validateEmail( $fullCustomer['email'] ) ) {
									$includeThisCustomer = false;
								}
							}

							// } Status
							if ( isset( $appliedFilters['status'] ) && ! empty( $appliedFilters['status'] ) ) {

								// } Check status
								if ( $appliedFilters['status'] != $fullCustomer['status'] ) {
									$includeThisCustomer = false;
								}
							}

							// } Source - ASSUMES is CF1!!!
							if ( isset( $appliedFilters['source'] ) && ! empty( $appliedFilters['source'] ) ) {

								// } Check Source
								if ( $appliedFilters['source'] != $fullCustomer['cf1'] ) {
									$includeThisCustomer = false;
								}
							}

							// } Postcode (can be AL1* etc.)
							if ( isset( $appliedFilters['postcode'] ) && ! empty( $appliedFilters['postcode'] ) ) {

								// } Remove spaces from both
								$cleanPostcode  = str_replace( ' ', '', $fullCustomer['postcode'] );
								$filterPostcode = str_replace( ' ', '', $appliedFilters['postcode'] );

								// } Check Postcode
								if ( ! str_starts_with( $cleanPostcode, $filterPostcode ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									$includeThisCustomer = false;
								}
							}

							// } Value From + To

							// } Calc total
							$totVal = zeroBS_customerTotalValue( $potentialCustomer['id'], $fullCustomer['invoices'], $fullCustomer['transactions'] );

							// } Compare
							if ( isset( $appliedFilters['valuefrom'] ) && ! empty( $appliedFilters['valuefrom'] ) ) {

								// } If less than valuefrom, then remove
								if ( $totVal < $appliedFilters['valuefrom'] ) {
									$includeThisCustomer = false;
								}
							}
							if ( isset( $appliedFilters['valueto'] ) && ! empty( $appliedFilters['valueto'] ) ) {

								// } If more than valueto, then remove
								if ( $totVal > $appliedFilters['valueto'] ) {
									$includeThisCustomer = false;
								}
							}

							// } Has Quote, inv, transaction
							if ( isset( $appliedFilters['hasquote'] ) && $appliedFilters['hasquote'] && count( $fullCustomer['quotes'] ) < 1 ) {
								$includeThisCustomer = false;
							}
							if ( isset( $appliedFilters['hasinv'] ) && $appliedFilters['hasinv'] && count( $fullCustomer['invoices'] ) < 1 ) {
								$includeThisCustomer = false;
							}
							if ( isset( $appliedFilters['hastransact'] ) && $appliedFilters['hastransact'] && count( $fullCustomer['transactions'] ) < 1 ) {
								$includeThisCustomer = false;
							}

							// } Finally... include or not?
							if ( $includeThisCustomer ) {
								$endingCustomerList[] = $fullCustomer;
							}
						}
					}
					// } ===============================================================
					// } / end filter post-query
					// } ===============================================================

					// } External source/id (LATER)

						// 'meta_key'   => 'zbs_customer_ext_'.$approvedExternalSource,
						// 'meta_value' => $externalID

					// } Set as global
					$zbsCustomerFiltersCurrentList = $endingCustomerList;

	} else { // } / end of "is already cached/not needed"

		// } Use cached list
		$endingCustomerList = $zbsCustomerFiltersCurrentList;

	}

		// } Do paging (lol wrong end) #postpaging
	if ( ! $forcePaging ) {

		// } Per Page
		if ( $perPage < 0 ) {
			$perPage = 10;
		} else {
			$perPage = (int) $perPage;
		}

		// } Offset
		$thisOffset = 0;
		$actualPage = $page - 1;
		if ( $actualPage < 0 ) {
			$actualPage = 0;
		}
		if ( $actualPage > 0 ) {
			$thisOffset = $perPage * $actualPage;
		}

		// } Anything to do?
		if ( isset( $thisOffset ) ) {

			// } SLICE
			$endingCustomerList = array_slice( $endingCustomerList, $thisOffset, $perPage );

		}
	}

		// DEBUG echo '<h2>endingCustomerList</h2><pre>'; print_r($endingCustomerList); echo '</pre>';

		// } QPI
		// $zbsQPI['retrieveCustomers3'] = round(zeroBSCRM_mtime_float() - #$zbsQPI['retrieveCustomers3'],2).'s';

		// } Return
		return $endingCustomerList;
}

// } Only used by AJAX, also returns top X customers :)
function zeroBS__customerFiltersRetrieveCustomerCountAndTopCustomers( $countToReturn = 3 ) {

	// } REQUIRES that zbs_customerFiltersRetrieveCustomers has been run BEFORE this
	global $zbsCustomerFiltersCurrentList;

	if ( isset( $zbsCustomerFiltersCurrentList ) && is_array( $zbsCustomerFiltersCurrentList ) ) {

		// } return
		return array(
			'count' => count( $zbsCustomerFiltersCurrentList ),
			'top'   => array_slice( $zbsCustomerFiltersCurrentList, 0, $countToReturn ),
		);

	} else {

		// } Run - without params it'll return first page, but retrieve all into cache var (what we need for count)
		$zbsCustomersFiltered = zbs_customerFiltersRetrieveCustomers();

		// } return count
		return array(
			'count' => count( $zbsCustomerFiltersCurrentList ),
			'top'   => array_slice( $zbsCustomersFiltered, 0, $countToReturn ),
		);

	}
}

/*
======================================================
	/ Customer Filter Funcs
	====================================================== */
