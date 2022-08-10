<?php

class Core_Bg_Override {

	/**
	 * Holds the theme mods before the Customizer saves
	 *
	 * @var array
	 */
	private $mods = array();

	/**
	 * The Core Background properties we're interested in
	 *
	 * @var array
	 */
	private $props = array(
		'background_image',
		'background_color',
		'background_repeat',
		'background_position_x',
		'background_attachment',
		'background_image_thumb',
	);

	/**
	 * The name of the theme_mod we'll save our background properties in
	 *
	 * @var string
	 */
	private $post_upgrade_parity_mod = 'custom-colors-parity';

	/**
	 * Crude constructor. Sets up the actions for whether we're in a save override context
	 * or the default display override context
	 *
	 * @param boolean $save_overrides
	 */
	public function __construct( $save_overrides = false ) {
		$this->mods = get_theme_mods();

		if ( $save_overrides ) {
			add_action( 'shutdown', array( $this, 'restore_theme_mods' ) );
		} else {
			foreach ( $this->props as $prop ) {
				add_filter( "theme_mod_$prop", array( $this, $prop ) );
			}
		}
	}

	/**
	 * Called when we want the user upgrades to Custom Design. Permanently sets the parity
	 * we were heretofore achieving with filters.
	 *
	 * @return void
	 */
	public function do_upgrade() {
		// first, let's ditch those filters that we don't need, however this was invoked.
		remove_action( 'shutdown', array( $this, 'restore_theme_mods' ) );
		foreach ( $this->props as $prop ) {
				remove_filter( "theme_mod_$prop", array( $this, $prop ) );
		}

		// now, time for parity
		$previewed_bg_mods = get_theme_mod( $this->post_upgrade_parity_mod, false );
		// nothing set? bail.
		if ( ! is_array( $previewed_bg_mods ) ) {
			return;
		}

		// if the preview mod had it active, set it. otherwise, remove it
		foreach ( $this->props as $prop ) {
			if ( isset( $previewed_bg_mods[ $prop ] ) ) {
				set_theme_mod( $prop, $previewed_bg_mods[ $prop ] );
			} else {
				remove_theme_mod( $prop );
			}
		}

		// background_image is a special case - we need to set it to a blank string
		// even if we didn't have something - otherwise we might get stuck with a default bg image
		if ( ! isset( $previewed_bg_mods['background_image'] ) ) {
			set_theme_mod( 'background_image', '' );
		}

		// remove our preview mod
		remove_theme_mod( $this->post_upgrade_parity_mod );

	}

	/**
	 * This is where we restore the background theme mods that were saved
	 * while previewing Colors and save the previewed mods for future display parity.
	 *
	 * @return void
	 */
	public function restore_theme_mods() {
		$pre_save            = $this->mods;
		$post_save           = get_theme_mods();
		$post_upgrade_parity = array();

		foreach ( $this->props as $prop ) {

			// we're going to store the saved value for usage after the upgrade has been purchased.
			if ( isset( $post_save[ $prop ] ) ) {
				$post_upgrade_parity[ $prop ] = $post_save[ $prop ];
			}

			// case 1: it wasn't set originally. unset it again.
			if ( ! isset( $pre_save[ $prop ] ) ) {
				remove_theme_mod( $prop );
			}
			// case 2: the value has changed. change it back.
			elseif ( $post_save[ $prop ] !== $pre_save[ $prop ] ) {
				set_theme_mod( $prop, $pre_save[ $prop ] );
			}
		}

		set_theme_mod( $this->post_upgrade_parity_mod, $post_upgrade_parity );
	}

	/**
	 * Magic method for our preview filters for all core bg theme_mods. DRY FTW.
	 *
	 * @param  string $name The method we're faking. Conveniently also the property we're overriding.
	 *                      We do this for all members of $this->props.
	 * @param  array  $args The arguments called on the method
	 * @return mixed string|bool The overridden value, if one is applicable, otherwise false.
	 */
	public function __call( $name, $args ) {
		$value     = $args[0];
		$overrides = get_theme_mod( $this->post_upgrade_parity_mod, false );
		// we don't have any overrides. Just return
		if ( ! is_array( $overrides ) ) {
			return $value;
		}
		return isset( $overrides[ $name ] ) ? $overrides[ $name ] : $value;
	}

}
