<?php
/**
 * ClientWPUser Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * ClientWPUser Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_ClientWPUser extends Data_Type_Base {

	// @todo - complete this class.

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'clientwpuser';
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_data" method.
	 *
	 * @see self::unify_data()
	 *
	 * @param mixed $entity The clientwpuser entity data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity ) {
		$entity = $this->unify_data( $entity );

		parent::__construct( $entity );
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * A validation method - helping to check if the data is as expected - in this case the display name.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool Whether the display name is set or not.
	 */
	public function isDisplayNameSet() {
		return isset( $this->entity['data']['display_name'] );
	}

	/**
	 * Validate entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity WP User entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		if ( ! is_array( $entity ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Unify how CRM WP User data is formatted.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity The data we want to potentially prepare.
	 * @return array|mixed The unified data.
	 */
	public function unify_data( $entity ) {
		if ( ! is_array( $entity ) ) {
			return $entity;
		}

		$wp_user = new \WP_User( $entity['id'] );

		return $this->tidy_user( (object) $wp_user );
	}

	/**
	 * Tidy the WP User object into an array.
	 *
	 * @since $$next-version$$
	 *
	 * @param WPUser $wp_user The WP User object.
	 * @return array The tidied user data.
	 */
	public function tidy_user( $wp_user ) {
		$clean_user                                = array();
		$clean_user['data']['ID']                  = $wp_user->data->ID;
		$clean_user['data']['user_login']          = $wp_user->data->user_login;
		$clean_user['data']['user_pass']           = $wp_user->data->user_pass;
		$clean_user['data']['user_nicename']       = $wp_user->data->user_nicename;
		$clean_user['data']['user_email']          = $wp_user->data->user_email;
		$clean_user['data']['user_url']            = $wp_user->data->user_url;
		$clean_user['data']['user_registered']     = $wp_user->data->user_registered;
		$clean_user['data']['user_activation_key'] = $wp_user->data->user_activation_key;
		$clean_user['data']['user_status']         = $wp_user->data->user_status;
		$clean_user['data']['display_name']        = $wp_user->data->display_name;
		$clean_user['ID']                          = $wp_user->ID;
		$clean_user['cap_key']                     = $wp_user->cap_key;
		$clean_user['roles'][0]                    = $wp_user->roles[0];
		$clean_user['allcaps']['read']             = $wp_user->allcaps['read'];
		$clean_user['allcaps']['level_0']          = $wp_user->allcaps['level_0'];
		$clean_user['filter']                      = $wp_user->filter;
		return $clean_user;
	}
}
