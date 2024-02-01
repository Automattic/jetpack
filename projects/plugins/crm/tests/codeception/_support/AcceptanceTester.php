<?php

/**
 * Inherited Methods
 *
 * @method void wantToTest($text)
 * @method void wantTo($text)
 * @method void execute($callable)
 * @method void expectTo($prediction)
 * @method void expect($prediction)
 * @method void amGoingTo($argumentation)
 * @method void am($role)
 * @method void lookForwardTo($achieveValue)
 * @method void comment($description)
 * @method void pause()
 *
 * @SuppressWarnings(PHPMD)
 */
class AcceptanceTester extends \Codeception\Actor {

	use _generated\AcceptanceTesterActions;

	/**
	 * Define custom actions here
	 */

	protected $pages = array(
		'dashboard'    => 'zerobscrm-dash',
		'contacts'     => 'manage-customers',
		'quotes'       => 'manage-quotes',
		'invoices'     => 'manage-invoices',
		'transactions' => 'manage-transactions',
		'tasks'        => 'manage-tasks',
		'settings'     => 'zerobscrm-plugin-settings',
		'extensions'   => 'zerobscrm-extensions',
		'add-edit'     => 'zbs-add-edit',
	);

	public function gotoAdminPage( $page_name, $query = '' ) {
		$this->amOnAdminPage( 'admin.php?page=' . $this->pages[ $page_name ] . $query );
	}
}
