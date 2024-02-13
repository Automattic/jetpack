<?php
namespace Helper;

use Module\WPBrowser;

class JPCRM_Acceptance extends WPBrowser {

	protected $server_output_path = __DIR__ . '/../../_output/server_output.log';

	// we use core.php slugs directly copied in via __CONSTRUCT below to allow easy updating.
	protected $slugs = array();

	/** @var RunProcess */
	protected $serverProcess;

	public function _beforeSuite( $settings = array() ) {
		parent::_beforeSuite( $settings );

		// To set this as a field, Codeception v5 needs "protected array $requiredFields = ...". But PHP 7.3 doesn't support that syntax.
		// @todo When we drop support for PHP 7.3, we can move this back to "protected array $requiredFields"
		$this->requiredFields = array(
			'adminUsername',
			'adminPassword',
			'adminPath',
			'database',
			'wp_prefix',
			'jpcrm_prefix',
			'wp_path',
		);

		// todo: prepare the database (remove and restore, change the home and siteurl options
		// $this->setup_database();

		$this->loadSlugs();

		$this->run_server();
	}

	public function _afterSuite() {
		parent::_afterSuite();

		$this->check_php_errors();

		$this->stop_server();
	}

	public function setup_database() {
		// todo: Setup the database before the test suite. Here we can select which database we're going to use
		// todo: Update the WP database with the url and hostname
	}

	public function run_server() {
		$server_host = $this->config['server_host'];
		$wp_path     = $this->config['wp_path'];

		$wp_version = '-';
		include_once "$wp_path/wp-includes/version.php"; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

		$serverCmd = "php -S $server_host -t $wp_path";

		$this->serverProcess = new RunProcess( $serverCmd, $this->server_output_path );
		echo "\e[33mPHP version:\e[96m " . PHP_VERSION;
		echo "\n\e[33mWordPress installation:\e[96m $wp_path";
		echo "\n\e[33mWordPress version:\e[96m $wp_version";
		echo "\n\n\e[33mSetting up the server...";

		$pid = $this->serverProcess->run();

		// Sleep for 1.5 seconds to give time to warm up the server
		usleep( 1500000 );

		echo "\n\e[97m\e[42m OK \e[49m \e[33mThe server is running at \e[96m$server_host \e[33mwith PID: \e[96m$pid \e[39m\n";
	}

	public function stop_server() {
		if ( $this->serverProcess && $this->serverProcess->isRunning() ) {
			echo "\n\e[33mStopping the server...";

			$this->serverProcess->stop();

			echo " \e[97m\e[42m\e[42m OK \e[49m \e[33mserver stopped\e[39m\n";
		}
	}

	public function __destruct() {
		$this->stop_server();
	}

	public function check_php_errors() {
		echo "\n\e[33mChecking PHP errors...";

		$output = fopen( $this->server_output_path, 'r' );

		$php_errors = array(
			'Error',
			'Notice',
			'Parsing Error',
			'Warning',
			'Fatal error',
			'Exception',
			'Deprecated',
		);

		$errors = array();

		while ( ! feof( $output ) ) {
			$row = fgets( $output );
			// todo: we can do the same using a regular expression and preg_match
			foreach ( $php_errors as $php_error ) {
				if ( str_contains( $row, $php_error ) ) {
					$errors[] = $row;
				}
			}
		}

		if ( count( $errors ) > 0 ) {
			$this->fail( "\e[91mHey! Something seems wrong.\n\e[39mThere are some PHP errors or notices:\e[93m\n\n" . print_r( $errors, true ) . "\e[39m" );
		} else {
			echo " \e[97m\e[42m\e[42m OK \e[49m\e[33m everything went well";
		}
	}

	// we use this to load in the default slugs (copied directly from ZeroBSCRM.Core.php)
	protected function loadSlugs() {

		// Last copied 4.0.8
		// Begin copy from Core.php

		##WLREMOVE
		$this->slugs['home'] = 'zerobscrm-plugin';
		##/WLREMOVE
		$this->slugs['dash']     = 'zerobscrm-dash';
		$this->slugs['settings'] = 'zerobscrm-plugin-settings';
		// $this->slugs['logout']          = "zerobscrm-logout";         // <<< 403 Forbidden
		$this->slugs['datatools'] = 'zerobscrm-datatools';
		// $this->slugs['welcome']         = "zerobscrm-welcome";        // <<< 403 Forbidden
		$this->slugs['crmresources'] = 'jpcrm-resources';
		$this->slugs['extensions']   = 'zerobscrm-extensions';
		// $this->slugs['export']          = "zerobscrm-export";         // <<< 403 Forbidden
		$this->slugs['systemstatus'] = 'zerobscrm-systemstatus';
		$this->slugs['support']      = 'jpcrm-support';
		// $this->slugs['sync']            = "zerobscrm-sync";           // <<< 403 Forbidden
		// These don't seem to be used anymore?
		// $this->slugs['connect']           = "zerobscrm-connect";
		// $this->slugs['app']           = "zerobscrm-app";
		// $this->slugs['whlang']            = "zerobscrm-whlang";
		// $this->slugs['customfields']  = "zerobscrm-customfields";
		// $this->slugs['import']            = "zerobscrm-import";

		// CSV importer Lite
		$this->slugs['csvlite'] = 'zerobscrm-csvimporterlite-app';

		// } FOR NOW wl needs these:
		// $this->slugs['bulktagger']      = "zerobscrm-batch-tagger";   // <<< 403 Forbidden
		// $this->slugs['salesdash']       = "sales-dash";               // <<< 403 Forbidden
		// $this->slugs['stripesync']      = "zerobscrm-stripesync-app"; // <<< 403 Forbidden
		// $this->slugs['woosync']         = "woo-importer";             // <<< 403 Forbidden
		// $this->slugs['paypalsync']      = "zerobscrm-paypal-app";     // <<< 403 Forbidden

		// } OTHER UI PAGES WHICH WEREN'T IN SLUG - MS CLASS ADDITION
		// } WH: Not sure which we're using here, think first set cleaner:
		// NOTE: DAL3 + these are referenced in DAL2.php so be aware :)
		// (This helps for generically linking back to list obj etc.)
		// USE zbsLink!
		$this->slugs['managecontacts']     = 'manage-customers';
		$this->slugs['managequotes']       = 'manage-quotes';
		$this->slugs['manageinvoices']     = 'manage-invoices';
		$this->slugs['managetransactions'] = 'manage-transactions';
		$this->slugs['managecompanies']    = 'manage-companies';
		$this->slugs['manageformscrm']     = 'manage-forms';
		$this->slugs['segments']           = 'manage-segments';
		$this->slugs['quote-templates']    = 'manage-quote-templates';
		$this->slugs['manage-tasks']       = 'manage-tasks';
		// $this->slugs['manage-tasks-completed'] = "manage-tasks-completed";  // <<< 403 Forbidden
		// $this->slugs['managecontactsprev']      = "manage-customers-crm";     // <<< 403 Forbidden
		// $this->slugs['managequotesprev']        = "manage-quotes-crm";        // <<< 403 Forbidden
		// $this->slugs['managetransactionsprev']  = "manage-transactions-crm";  // <<< 403 Forbidden
		// $this->slugs['manageinvoicesprev']      = "manage-invoices-crm";      // <<< 403 Forbidden
		// $this->slugs['managecompaniesprev']     = "manage-companies-crm";     // <<< 403 Forbidden
		// $this->slugs['manageformscrmprev']      = "manage-forms-crm";         // <<< 403 Forbidden

		// } NEW UI - ADD or EDIT, SEND EMAIL, NOTIFICATIONS
		$this->slugs['addedit']  = 'zbs-add-edit';
		$this->slugs['sendmail'] = 'zerobscrm-send-email';

		$this->slugs['emails'] = 'zerobscrm-emails';

		$this->slugs['notifications'] = 'zerobscrm-notifications';

		// } TEAM - Manage the CRM team permissions
		$this->slugs['team'] = 'zerobscrm-team';

		// } Export tools
		$this->slugs['export-tools'] = 'zbs-export-tools';

		// } Your Profile (for Calendar Sync and Personalised Stuff (like your own task history))
		$this->slugs['your-profile'] = 'your-crm-profile';

		$this->slugs['reminders'] = 'zbs-reminders';

		// } Adds a USER (i.e. puts our menu on user-new.php through ?page =)
		// $this->slugs['zbs-new-user']        = "zbs-add-user";                 // <<< 403 Forbidden
		// $this->slugs['zbs-edit-user']       = "zbs-edit-user";                // <<< 403 Forbidden

		// emails
		$this->slugs['email-templates'] = 'zbs-email-templates';

		// tag manager
		$this->slugs['tagmanager'] = 'tag-manager';

		// no access
		$this->slugs['zbs-noaccess'] = 'zbs-noaccess';

		// } Modules/extensions
		$this->slugs['modules']    = 'zerobscrm-modules';
		$this->slugs['extensions'] = 'zerobscrm-extensions';

		// } File Editor
		$this->slugs['editfile'] = 'zerobscrm-edit-file';

		// } Extensions Deactivated error
		$this->slugs['extensions-active'] = 'zbs-extensions-active';

		// End copy from Core.php

		// Addition of add-edit variants to catch edit pages :)
		// e.g. /wp-admin/admin.php?page=zbs-add-edit&action=edit&zbstype=quotetemplate
		// ... and tag manager pages
		// ... and export tool page
		$types = array( 'contact', 'company', 'quote', 'quotetemplate', 'invoice', 'transaction', 'event', 'form' );
		foreach ( $types as $type ) {

			// add new
			$this->slugs[ 'add-new-' . $type ] = 'zbs-add-edit&action=edit&zbstype=' . $type;

			// tag manager
			$this->slugs[ 'tag-mgr-' . $type ] = 'tag-manager&tagtype=' . $type;

			// export tools
			$this->slugs[ 'export-tools-' . $type ] = 'zbs-export-tools&zbstype=' . $type;

		}
	}

	public function getDatabase() {
		return $this->config['database'];
	}

	/**
	 * Get the JetpackCRM table name
	 *
	 * @param $name
	 * @return string
	 */
	public function table( $name ) {
		return $this->config['jpcrm_prefix'] . $name;
	}

	public function pdo() {
		return $this->getModule( 'Db' )->dbh;

		// $dbh->exec('CREATE DATABASE testestest');
	}

	/**
	 * Load a page from it's core slug
	 *
	 * @param $page_slug
	 * @param string    $query
	 */
	public function goToPageViaSlug( $page_slug, $query = '' ) {
		$this->amOnAdminPage( 'admin.php?page=' . $this->slugs[ $page_slug ] . $query );
	}

	/**
	 * retrieve slug pile
	 */
	public function getSlugs() {
		// pass back
		return $this->slugs;
	}

	/**
	 * Check if see PHP error in the page. Need debug mode on: define( 'WP_DEBUG', true );
	 */
	public function dontSeeAnyErrors() {
		$this->dontSee( 'Notice:  ' );
		$this->dontSee( 'Parse error:  ' );
		$this->dontSee( 'Warning:  ' );
		$this->dontSee( 'Fatal error:  ' );
	}
}
