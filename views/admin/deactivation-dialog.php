<?php
/**
 * The deactivation modal content.
 *
 * @package Jetpack
 *
 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 * because $data is magically loaded by Jetpack::load_view()
 */

?>
<div id="jetpack_deactivation_dialog">

	<div class="jetpack_deactivation_dialog_content">
		<p>
		<?php
		echo esc_html(
			sprintf(
				// translators: %d is the number of additional plugins using the jetpack connection.
				_n( // phpcs:ignore WordPress.WP.I18n.MismatchedPlaceholders
					'The Jetpack Connection is also used by %d other plugin, and it will lose connection.',
					'The Jetpack Connection is also used by %d other plugins, and they will lose connection.',
					count( $data ),
					'jetpack'
				),
				count( $data )
			)
		);
		?>
		</p>

		<ul>
			<?php foreach ( $data as $plugin_slug => $plugin_args ) : ?>

				<li>
					<?php echo esc_html( isset( $plugin_args['name'] ) ? $plugin_args['name'] : $plugin_slug ); ?>
				</li>

			<?php endforeach; ?>
		</ul>


	</div>


	<div class="jetpack_deactivation_dialog_content__buttons-row-container">
		<div class="jetpack_deactivation_dialog_content__buttons-row">
			<p>Are you sure you want to disconnect?</p>
			<div class="jetpack_deactivation_dialog_content__buttons">
				<button type="button" id="jetpack_deactivation_dialog_content__button-cancel"><?php esc_html_e( 'Cancel', 'jetpack' ); ?></button>
				<button type="button" id="jetpack_deactivation_dialog_content__button-deactivate"><?php esc_html_e( 'Disconnect and Deactivate', 'jetpack' ); ?></button>
			</div>
		</div>
	</div>
</div>
