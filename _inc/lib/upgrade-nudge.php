<?php
/**
 * Upgrade Nudge Library
 *
 * Display a plan upgrade nudge on the frontend
 */

class Jetpack_Upgrade_Nudge {

	/**
	 * Return a message telling the user to upgrade to enable the block.
	 *
	 * @since 7.6.0
	 *
	 * @return string The message telling the user to upgrade
	 */
	public static function get_upgrade_message() {
		$support_url = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
		? 'https://support.wordpress.com/simple-payments/'
		: 'https://jetpack.com/support/simple-payment-button/';

		return sprintf(
			wp_kses(
				__( 'Your plan doesn\'t include Simple Payments. <a href="%s" rel="noopener noreferrer" target="_blank">Learn more and upgrade</a>.', 'jetpack' ),
				array( 'a' => array( 'href' => array(), 'rel' => array(), 'target' => array() ) )
			),
			esc_url( $support_url )
		);
	}

	/**
	 * Return a message telling the user to upgrade to enable the block.
	 *
	 * @since 7.6.0
	 *
	 * @return string The message telling the user to upgrade
	 */
	public static function get_upgrade_nudge( $plan_name = 'Premium' ) {
		$title = sprintf( __( 'This block is available under the %1$s Plan.', 'jetpack' ),
			$plan_name
		);
		$message = __( 'It will be hidden from site visitors until you upgrade.', 'jetpack' );
		$button_label = __( 'Upgrade', 'jetpack' );

		// TODO: Make button work

		return <<<EOF
<div class="wp-block editor-block-list__block block-editor-block-list__block is-selected has-warning is-interactive">
	<div class="editor-warning block-editor-warning jetpack-upgrade-nudge">
		<div class="editor-warning__contents block-editor-warning__contents">
			<p class="editor-warning__message block-editor-warning__message">
				<div class="jetpack-upgrade-nudge__info">
				<!--<Gridicon class="jetpack-upgrade-nudge__icon" icon="star" size={ 18 } />-->
				<div className="jetpack-upgrade-nudge__text-container">
					<span class="jetpack-upgrade-nudge__title">
						$title
					</span>
					<span class="jetpack-upgrade-nudge__message">
						$message
					</span>
				</div>
			</p>

			<div class="editor-warning__actions block-editor-warning__actions">
				<span class="editor-warning__action block-editor-warning__action">
					<button class="is-primary" onClick="" target="_top">
						$button_label
					</button>
				</span>
			</div>
		</div>
	</div>
</div>
EOF;
	}
}