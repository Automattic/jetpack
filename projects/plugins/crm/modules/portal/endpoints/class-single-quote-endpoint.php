<?php
namespace Automattic\JetpackCRM;

if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;

class Single_Quote_Endpoint extends Client_Portal_Endpoint {

	public static function register_endpoint( $endpoints, $client_portal ) {
		global $zbs;

		if ( zeroBSCRM_getSetting( 'feat_quotes' ) > 0 ) {
			$new_endpoint = new Single_Quote_Endpoint( $client_portal );

			$new_endpoint->portal                       = $client_portal;
			$new_endpoint->slug                         = $client_portal->get_endpoint( ZBS_TYPE_QUOTE );
			$new_endpoint->hide_from_menu               = true;
			$new_endpoint->template_name                = 'single-quote.php';
			$new_endpoint->add_rewrite_endpoint         = true;
			$new_endpoint->should_check_user_permission = $zbs->settings->get( 'easyaccesslinks' ) === "0";
			$new_endpoint->hide_from_settings_page      = true;

			$endpoints[] = $new_endpoint;
		}

		return $endpoints;
	}

	/* 
	* Generates HTML for portal single email
	*
	* Previously called zeroBSCRM_quote_generatePortalQuoteHTML
	*/
	function single_quote_html_output( $quote_id = -1, $quote_hash='' ) {

		global $post, $zbs;

		$quote_data = zeroBS_getQuote( $quote_id, true );
		$quote_content = '';
		$acceptable = false;

		if ( !$quote_data ) {
			// something is wrong...abort!
			$this->show_single_obj_error_and_die();
		}

		// content
		if ( isset( $quote_data['content'] ) ) {
			$placeholder_templating = $zbs->get_templating();
			// get initial replacements arr
			$replacements              = $placeholder_templating->get_generic_replacements();
			$replacements['quote-url'] = zeroBSCRM_portal_linkObj( $quote_id, ZBS_TYPE_QUOTE );
			$quote_content             = $placeholder_templating->replace_placeholders( array( 'global', 'quote' ), $quote_data['content'], $replacements, array( ZBS_TYPE_QUOTE => $quote_data ) );
		}

		// hash (if not passed)
		if ( isset( $quote_data['hash'] ) ) {
			$quote_hash = $quote_data['hash'];
		}

		//  acceptable?
		if ( empty( $quote_data['accepted'] ) ) {
			$acceptable = true;
		} else {
			// setting this shows it at base of quote, when accepted
			if ( $quote_data['accepted'] > 0 ) {
				$acceptedDate = $quote_data['accepted_date'];
			}
		}
?>
		<div id="zerobs-proposal-<?php echo esc_attr( $quote_id ); ?> main" class="zerobs-proposal entry-content hentry" style="margin-bottom:50px;margin-top:0px;">

			<div class="zerobs-proposal-body"><?php echo wp_kses( wpautop( $quote_content ), $zbs->acceptable_html ); ?></div>

			<?php
			if ( $acceptable ) {
					// js-exposed success/failure messages
					?>
						<div id="zbs-quote-accepted-<?php echo esc_attr( $quote_id ) ?>" class="alert alert-success" style="display:none;margin-bottom:5em;">
							<?php esc_html_e( 'Quote accepted. Thank you!', 'zero-bs-crm' ); ?>
						</div>
						<div id="zbs-quote-failed-<?php echo esc_attr( $quote_id ) ?>" class="alert alert-warning" style="display:none;margin-bottom:5em;">
							<?php esc_html_e( 'Quote could not be accepted at this time.', 'zero-bs-crm' ); ?>
						</div>
						<div class="zerobs-proposal-actions" id="zerobs-proposal-actions-<?php echo esc_attr( $quote_id ); ?>">
							<h3><?php esc_html_e( 'Accept Quote?', 'zero-bs-crm' ); ?></h3>

							<button id="zbs-proposal-accept" class="button btn btn-large btn-success button-success" type="button"><?php esc_html_e( 'Accept', 'zero-bs-crm' ); ?></button>

					<?php
				}
				if ( isset( $acceptedDate ) ) {
					?>

						<div class="zerobs-proposal-actions" id="zerobs-proposal-actions-<?php echo esc_attr( $quote_id ); ?>">
							<h3><?php esc_html_e( 'Accepted', 'zero-bs-crm' ); ?> <?php echo esc_html( $acceptedDate ); ?></h3>
						</div>

					<?php
				}
			?>

		</div>
		<div style="clear:both"></div>
		<script type="text/javascript">
			var jpcrm_proposal_data = {
				'quote_id': '<?php echo esc_js( $quote_id ); ?>',
				'quote_hash': '<?php echo esc_js( $quote_hash ); ?>',
				'proposal_nonce': '<?php echo esc_js( wp_create_nonce( 'zbscrmquo-nonce' ) );?>',
				'ajax_url': '<?php echo esc_url( admin_url( 'admin-ajax.php') ); ?>'
			};
		</script>
		<?php
		wp_enqueue_script('jpcrm_public_proposal_js', plugins_url('/js/ZeroBSCRM.public.proposals'.wp_scripts_get_suffix().'.js',ZBS_ROOTFILE), array( 'jquery' ), $zbs->version);

	}
}
