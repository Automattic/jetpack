<?php
/**
 * Admin notice base class. Override this to implement each admin notice Jetpack Boost may show.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

/**
 * Class Admin_Notice
 */
abstract class Admin_Notice {

	/**
	 * Override to provide admin notice types with a unique slug.
	 *
	 * @return string
	 */
	abstract public function get_slug();

	/**
	 * Get the notice id.
	 *
	 * @return string
	 */
	public function get_id() {
		return 'jetpack-boost-notice-' . $this->get_slug();
	}

	/**
	 * Override to provide a title for this admin notice.
	 *
	 * @return string
	 */
	abstract public function get_title();

	/**
	 * Override to specify whether this notice should include a link to the settings page.
	 * (Link not shown if already on the Jetpack Boost settings page).
	 *
	 * @return bool
	 */
	public function should_show_settings_link() {
		return true;
	}

	/**
	 * Override to render the inner message inside this admin notice.
	 *
	 * @param bool $on_settings_page - True if currently viewing the Jetpack Boost settings page.
	 */
	abstract protected function render_message( $on_settings_page );

	/**
	 * Get settings link text.
	 */
	protected function get_settings_link_text() {
		return __( 'Go to the Jetpack Boost Settings page', 'jetpack-boost' );
	}

	/**
	 * Dismiss link text.
	 */
	protected function get_dismiss_link_text() {
		return __( 'Dismiss notice', 'jetpack-boost' );
	}

	/**
	 * Helper method to generate a dismissal link for this message.
	 */
	private function get_dismiss_url() {
		return add_query_arg(
			array(
				'jb-dismiss-notice' => rawurlencode( $this->get_slug() ),
			)
		);
	}

	/**
	 * Renders this admin notice. Calls render_message to render the admin notice body.
	 *
	 * @param bool $on_settings_page - True if currently viewing the Jetpack Boost settings page.
	 */
	final public function render( $on_settings_page ) {
		?>
		<div id="<?php echo esc_attr( $this->get_id() ); ?>" class="notice notice-warning is-dismissible">
			<h3>
				<?php echo esc_html( $this->get_title() ); ?>
			</h3>

			<?php $this->render_message( $on_settings_page ); ?>

			<p>
				<?php if ( ! $on_settings_page && $this->should_show_settings_link() ) : ?>
					<a class="button button-primary" href="<?php echo esc_url( admin_url( 'admin.php?page=' . Admin::MENU_SLUG ) ); ?>"><strong><?php echo esc_html( $this->get_settings_link_text() ); ?></strong></a>
					&nbsp; &nbsp;
				<?php endif ?>

				<a class="jb-dismiss-notice" href="<?php echo esc_url( $this->get_dismiss_url() ); ?>"><strong><?php echo esc_html( $this->get_dismiss_link_text() ); ?></strong></a>
			</p>
		</div>
		<?php
	}
}
