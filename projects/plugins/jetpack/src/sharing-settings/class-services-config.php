<?php
/**
 * The sharing services configuration UI.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use Automattic\Jetpack\Status;

/**
 * The drag-and-drop services list and the settings that go with it.
 *
 * Moved here verbatim from Sharing_Admin, minus the block-theme notice it used
 * to render for Simple only: Sharing_Section now shows that on every platform.
 */
final class Services_Config {

	/**
	 * Display services admin UI for settings.
	 *
	 * @return void
	 */
	public function render() {
		if ( ! class_exists( 'Sharing_Service' ) && ! include_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-service.php' ) {
			return;
		}

		$sharer  = new \Sharing_Service();
		$enabled = $sharer->get_blog_services();
		$global  = $sharer->get_global_options();

		$shows = array_values( get_post_types( array( 'public' => true ) ) );
		array_unshift( $shows, 'index' );
		if ( ! isset( $global['sharing_label'] ) ) {
			$global['sharing_label'] = __( 'Share this:', 'jetpack' );
		}
		?>
		<div class="share_manage_options">
		<h2><?php esc_html_e( 'Sharing Buttons', 'jetpack' ); ?></h2>
		<p><?php esc_html_e( 'Add sharing buttons to your blog and allow your visitors to share posts with their friends.', 'jetpack' ); ?></p>


		<div id="services-config">
			<table id="available-services">
					<tr>
					<td class="description">
						<h3><?php esc_html_e( 'Available Services', 'jetpack' ); ?></h3>
						<p><?php esc_html_e( "Drag and drop the services you'd like to enable into the box below.", 'jetpack' ); ?></p>
						<p><a href="#TB_inline?height=395&amp;width=600&amp;inlineId=new-service" class="thickbox" id="add-a-new-service"><?php esc_html_e( 'Add a new service', 'jetpack' ); ?></a></p>
					</td>
					<td class="services">
						<ul class="services-available" style="height: 100px;">
							<?php foreach ( $sharer->get_all_services_blog() as $id => $service ) : ?>
								<?php
								if ( ! isset( $enabled['all'][ $id ] ) ) {
										$this->output_service( $id, $service );
								}
								?>
							<?php endforeach; ?>
						</ul>
						<?php
						if ( ( new Status() )->is_private_site() ) {
							echo '<p><strong>' . esc_html__( 'Please note that your services have been restricted because your site is private.', 'jetpack' ) . '</strong></p>';
						}
						?>
						<br class="clearing" />
					</td>
					</tr>
			</table>

			<table id="enabled-services">
				<tr>
					<td class="description">
						<h3>
							<?php esc_html_e( 'Enabled Services', 'jetpack' ); ?>
							<span class="spinner" style="vertical-align: middle"></span>
						</h3>
						<p><?php esc_html_e( 'Services dragged here will appear individually.', 'jetpack' ); ?></p>
					</td>
					<td class="services" id="share-drop-target">
							<h2 id="drag-instructions"
							<?php
							if ( is_countable( $enabled['visible'] ) && count( $enabled['visible'] ) > 0 ) {
								echo ' style="display: none"';}
							?>
							><?php esc_html_e( 'Drag and drop available services here.', 'jetpack' ); ?></h2>

								<ul class="services-enabled">
									<?php foreach ( $enabled['visible'] as $id => $service ) : ?>
										<?php $this->output_service( $id, $service, true ); ?>
									<?php endforeach; ?>

									<li class="end-fix"></li>
								</ul>
					</td>
					<td id="hidden-drop-target" class="services">
							<p><?php esc_html_e( 'Services dragged here will be hidden behind a share button.', 'jetpack' ); ?></p>

							<ul class="services-hidden">
									<?php foreach ( $enabled['hidden'] as $id => $service ) : ?>
										<?php $this->output_service( $id, $service, true ); ?>
									<?php endforeach; ?>
									<li class="end-fix"></li>
							</ul>
					</td>
				</tr>
			</table>

			<table id="live-preview">
				<tr>
					<td class="description">
						<h3><?php esc_html_e( 'Live Preview', 'jetpack' ); ?></h3>
					</td>
					<td class="services">
						<h2 <?php echo ( is_countable( $enabled['all'] ) && count( $enabled['all'] ) > 0 ) ? ' style="display: none"' : ''; ?>><?php esc_html_e( 'Sharing is off. Add services above to enable.', 'jetpack' ); ?></h2>
						<div class="sharedaddy sd-sharing-enabled">
							<?php if ( is_countable( $enabled['all'] ) && count( $enabled['all'] ) > 0 ) : ?>
							<h3 class="sd-title"><?php echo esc_html( $global['sharing_label'] ); ?></h3>
							<?php endif; ?>
							<div class="sd-content">
								<ul class="preview">
									<?php foreach ( $enabled['visible'] as $id => $service ) : ?>
										<?php $this->output_preview( $service ); ?>
									<?php endforeach; ?>

									<?php if ( is_countable( $enabled['hidden'] ) && count( $enabled['hidden'] ) > 0 ) : ?>
									<li class="advanced"><a href="#" class="sharing-anchor sd-button share-more"><span><?php esc_html_e( 'More', 'jetpack' ); ?></span></a></li>
									<?php endif; ?>
								</ul>

								<?php if ( is_countable( $enabled['hidden'] ) && count( $enabled['hidden'] ) > 0 ) : ?>
								<div class="sharing-hidden">
									<div class="inner" style="display: none; <?php echo count( $enabled['hidden'] ) === 1 ? 'width:150px;' : ''; ?>">
										<?php if ( count( $enabled['hidden'] ) === 1 ) : ?>
											<ul style="background-image:none;">
										<?php else : ?>
											<ul>
										<?php endif; ?>

										<?php
										foreach ( $enabled['hidden'] as $id => $service ) {
											$this->output_preview( $service );
										}
										?>
										</ul>
									</div>
								</div>
								<?php endif; ?>

								<ul class="archive" style="display:none;">
								<?php
								foreach ( $sharer->get_all_services_blog() as $id => $service ) :
									if ( isset( $enabled['visible'][ $id ] ) ) {
										$service = $enabled['visible'][ $id ];
									} elseif ( isset( $enabled['hidden'][ $id ] ) ) {
										$service = $enabled['hidden'][ $id ];
									}

									$service->button_style = 'icon-text';   // The archive needs the full text, which is removed in JS later.
									$service->smart        = false;
									$this->output_preview( $service );
									endforeach;
								?>
									<li class="advanced"><a href="#" class="sharing-anchor sd-button share-more"><span><?php esc_html_e( 'More', 'jetpack' ); ?></span></a></li>
								</ul>
							</div>
						</div>
						<br class="clearing" />
					</td>
				</tr>
			</table>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" id="save-enabled-shares">
					<input type="hidden" name="action" value="sharing_save_services" />
					<input type="hidden" name="visible" value="<?php echo esc_attr( implode( ',', array_keys( $enabled['visible'] ) ) ); ?>" />
					<input type="hidden" name="hidden" value="<?php echo esc_attr( implode( ',', array_keys( $enabled['hidden'] ) ) ); ?>" />
					<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( 'sharing-options' ) ); ?>" />
				</form>
		</div>

		<form method="post" action="">
			<table class="form-table">
				<tbody>
					<tr valign="top">
						<th scope="row"><label><?php esc_html_e( 'Button style', 'jetpack' ); ?></label></th>
						<td>
							<select name="button_style" id="button_style">
								<option<?php echo ( $global['button_style'] === 'icon-text' ) ? ' selected="selected"' : ''; ?> value="icon-text"><?php esc_html_e( 'Icon + text', 'jetpack' ); ?></option>
								<option<?php echo ( $global['button_style'] === 'icon' ) ? ' selected="selected"' : ''; ?> value="icon"><?php esc_html_e( 'Icon only', 'jetpack' ); ?></option>
								<option<?php echo ( $global['button_style'] === 'text' ) ? ' selected="selected"' : ''; ?> value="text"><?php esc_html_e( 'Text only', 'jetpack' ); ?></option>
								<option<?php echo ( $global['button_style'] === 'official' ) ? ' selected="selected"' : ''; ?> value="official"><?php esc_html_e( 'Official buttons', 'jetpack' ); ?></option>
							</select>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><label><?php esc_html_e( 'Sharing label', 'jetpack' ); ?></label></th>
						<td>
							<input type="text" name="sharing_label" value="<?php echo esc_attr( $global['sharing_label'] ); ?>" />
						</td>
					</tr>
					<?php
					/**
					 * Filters the HTML at the beginning of the "Show button on" row.
					 *
					 * @module sharedaddy
					 *
					 * @since 2.1.0
					 *
					 * @param string $var Opening HTML tag at the beginning of the "Show button on" row.
					 */
					echo apply_filters( 'sharing_show_buttons_on_row_start', '<tr valign="top">' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
						<th scope="row"><label><?php esc_html_e( 'Show buttons on', 'jetpack' ); ?></label></th>
							<td>
								<?php
								$br = false;
								foreach ( $shows as $show ) :
									if ( 'index' === $show ) {
										$label = __( 'Front Page, Archive Pages, and Search Results', 'jetpack' );
									} else {
										$post_type_object = get_post_type_object( $show );
										$label            = $post_type_object->labels->name;
									}
									?>
									<?php
									if ( $br ) {
										echo '<br />';
									}
									?>
								<label><input type="checkbox"<?php checked( in_array( $show, $global['show'], true ) ); ?> name="show[]" value="<?php echo esc_attr( $show ); ?>" /> <?php echo esc_html( $label ); ?></label>
									<?php
									$br = true;
								endforeach;
								?>
							</td>
					<?php
					/**
					 * Filters the HTML at the end of the "Show button on" row.
					 *
					 * @module sharedaddy
					 *
					 * @since 2.1.0
					 *
					 * @param string $var Closing HTML tag at the end of the "Show button on" row.
					 */
					echo apply_filters( 'sharing_show_buttons_on_row_end', '</tr>' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>

					<?php
					/**
					 * Fires at the end of the sharing global options settings table.
					 *
					 * @module sharedaddy
					 *
					 * @since 1.1.0
					 */
					do_action( 'sharing_global_options' );
					?>
				</tbody>
			</table>

			<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack' ); ?>" />
			</p>

				<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( 'sharing-options' ) ); ?>" />
		</form>

	<div id="new-service" style="display: none">
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" id="new-service-form">
			<table class="form-table">
				<tbody>
					<tr valign="top">
						<th scope="row" width="100"><label><?php esc_html_e( 'Service name', 'jetpack' ); ?></label></th>
						<td>
							<input type="text" name="sharing_name" id="new_sharing_name" size="40" />
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" width="100"><label><?php esc_html_e( 'Sharing URL', 'jetpack' ); ?></label></th>
						<td>
							<input type="text" name="sharing_url" id="new_sharing_url" size="40" />

							<p><?php esc_html_e( 'You can add the following variables to your service sharing URL:', 'jetpack' ); ?><br/>
							<code>%post_id%</code>, <code>%post_title%</code>, <code>%post_slug%</code>, <code>%post_url%</code>, <code>%post_full_url%</code>, <code>%post_excerpt%</code>, <code>%post_tags%</code>, <code>%home_url%</code></p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row" width="100"><label><?php esc_html_e( 'Icon URL', 'jetpack' ); ?></label></th>
						<td>
							<input type="text" name="sharing_icon" id="new_sharing_icon" size="40" />
							<p><?php esc_html_e( 'Enter the URL of a 16x16px icon you want to use for this service.', 'jetpack' ); ?></p>
						</td>
					</tr>
					<tr valign="top" width="100">
						<th scope="row"></th>
						<td>
							<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Create Share Button', 'jetpack' ); ?>" />
							<span class="spinner" style="vertical-align: middle"></span>
						</td>
					</tr>

					<?php
					/**
					 * Fires after the custom sharing service form
					 *
					 * @module sharedaddy
					 *
					 * @since 1.1.0
					 */
					do_action( 'sharing_new_service_form' );
					?>
				</tbody>
			</table>

			<?php
			/**
			 * Fires at the bottom of the admin sharing settings screen.
			 *
			 * @module sharedaddy
			 *
			 * @since 1.6.0
			 */
			do_action( 'post_admin_screen_sharing' );
			?>

				<div class="inerror" style="display: none; margin-top: 15px">
					<p><?php esc_html_e( 'An error occurred creating your new sharing service - please check you gave valid details.', 'jetpack' ); ?></p>
				</div>

			<input type="hidden" name="action" value="sharing_new_service" />
			<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( 'sharing-new_service' ) ); ?>" />
		</form>
	</div>
		<?php
	}

	/**
	 * Display a specific sharing service.
	 *
	 * @param int    $id            Service unique ID.
	 * @param object $service       Sharing service.
	 * @param bool   $show_dropdown Display a dropdown. Not in use at the moment.
	 *
	 * @return void
	 */
	public function output_service( $id, $service, $show_dropdown = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$title             = '';
		$klasses           = array( 'service', 'advanced', 'share-' . $service->get_class() );
		$displayed_klasses = implode( ' ', $klasses );

		if ( $service->is_deprecated() ) {
			/* translators: %1$s is the name of a deprecated Sharing Service like "Google+" */
			$title     = sprintf( __( 'The %1$s sharing service has shut down or discontinued support for sharing buttons. This sharing button is not displayed to your visitors and should be removed.', 'jetpack' ), $service->get_name() );
			$klasses[] = 'share-deprecated';
		}

		?>
	<li class="<?php echo esc_attr( $displayed_klasses ); ?>" id="<?php echo esc_attr( $service->get_id() ); ?>" tabindex="0" title="<?php echo esc_attr( $title ); ?>">
		<span class="options-left"><?php echo esc_html( $service->get_name() ); ?></span>
		<?php if ( str_starts_with( $service->get_id(), 'custom-' ) || $service->has_advanced_options() ) : ?>
		<span class="close"><a href="#" class="remove">&times;</a></span>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>">
			<input type="hidden" name="action" value="sharing_delete_service" />
			<input type="hidden" name="service" value="<?php echo esc_attr( $id ); ?>" />
			<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( 'sharing-options_' . $id ) ); ?>" />
		</form>
		<?php endif; ?>
	</li>
		<?php
	}

	/**
	 * Display a preview of a sharing service.
	 *
	 * @param object $service Sharing service object.
	 *
	 * @return void
	 */
	public function output_preview( $service ) {
		$klasses = array( 'advanced', 'preview-item' );

		if ( $service->button_style !== 'text' || $service->has_custom_button_style() ) {
			$klasses[] = 'preview-' . $service->get_class();
			$klasses[] = 'share-' . $service->get_class();
			if ( $service->is_deprecated() ) {
				$klasses[] = 'share-deprecated';
			}

			if ( $service->get_class() !== $service->get_id() ) {
				$klasses[] = 'preview-' . $service->get_id();
			}
		}

		echo '<li class="' . esc_attr( implode( ' ', $klasses ) ) . '">';
		$service->display_preview();
		echo '</li>';
	}
}
