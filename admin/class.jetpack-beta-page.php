<?php
jetpack_require_lib( 'admin-pages/class.jetpack-admin-page' );

error_log( print_r( 'loaded bet page...',1 ));
class Jetpack_Beta_Page extends Jetpack_Admin_Page {

	protected $dont_show_if_not_active = false;

	function add_page_actions( $hook ) {}

	// Adds the Settings sub menu
	function get_page_hook() {
		return add_submenu_page( 'jetpack', __( 'beta', 'jetpack' ), __( 'Beta', 'jetpack' ), 'jetpack_manage_modules', 'beta', array( $this, 'render' ) );
	}

	// Renders the module list table where you can use bulk action or row
	// actions to activate/deactivate and configure modules
	function page_render() {
		$this->admin_page_top();
		$this->admin_page_content();
		$this->admin_page_bottom();
	}

	function branch_option( $header, $sub = 'sub', $is_last = false ) {
		if ( is_object( $sub ) ) {
			$branch = $sub;
		} else {
			$manifest = Jetpack_Beta_Tester::get_beta_manifest();
			$branch = $manifest->{$sub};
		}

		$is_compact = $is_last ? '' : 'is-compact';
		$more_info = '';
		if ( is_int( $branch->pr ) ) {
			$more_info = sprintf( __( '<a href="https://github.com/Automattic/jetpack/pull/%s">more info</a> - ' ), $branch->pr );
		}

		$header = str_replace( '-', ' ', $header );
		$header = str_replace( '_', ' / ', $header );
		?>
		<div class="dops-foldable-card has-expanded-summary dops-card <?php echo $is_compact; ?>">
			<div class="dops-foldable-card__header has-border" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0">
				<span class="dops-foldable-card__main" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0.0">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text"><?php echo $header; ?></div>
						<div class="dops-foldable-card__subheader"><?php echo $more_info; printf( __( 'last updated %s ago' ) , human_time_diff( strtotime( $branch->update_date ) ) ); ?></div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary" >
					<span class="dops-foldable-card__summary">
						<button type="submit" class="is-primary jp-form-button dops-button is-primary is-compact" >Activate</button>
					</span>
				</span>
			</div>
		</div>
		<?php
	}

	function header( $title ) {
		echo '<header><h2 class="jp-jetpack-connect__container-subtitle">' . $title . '</h2></header>';
	}

	function show_branches( $section, $title ) {
		$manifest = Jetpack_Beta_Tester::get_beta_manifest();
		$this->header( $title );
		$count = 0;
		$branches = (array) $manifest->{$section};
		$count_all = count( $branches );

		foreach ( $branches as $branch_name => $branch ) {
			$count++;
			$is_last = $count_all === $count ? true : false;
			$this->branch_option( $branch_name, $branch, $is_last );
		}
	}
	function pr_branches() {
		$this->show_branches( 'pr', __( 'PR Branches' ) );
	}

	function rc_branches() {
		$this->show_branches( 'rc',  __( 'Release Candidates' ) );
	}

	function admin_page_content() {
		?>
		<div class="dops-foldable-card is-expanded has-expanded-summary dops-card is-compact">
			<div class="dops-foldable-card__header has-border">
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text">Jetpack Beta</div>
					</div>
				</span>
			</div>
			<div class="dops-foldable-card__content">
				Your current version:
			</div>
		</div>
		<?php
			$this->branch_option( __( 'Bleeding Edge' ), 'master' );
			// $this->branch_option( __( 'Release Candidate' ), 'rc' );
			$this->rc_branches();
			$this->pr_branches();
		?>

		<div class="dops-foldable-card has-expanded-summary dops-card">
			<div class="dops-foldable-card__header has-border" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0">
				<span class="dops-foldable-card__main" data-reactid=".0.0.1.2.1.1:$module-card_markdown.1:0.0">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text"><?php _e( 'Found a bug?', 'jetpack-beta' ); ?></div>
						<div class="dops-foldable-card__subheader"><?php _e( 'We would love to hear about it', 'jetpack-beta' ); ?></div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary" >
					<span class="dops-foldable-card__summary">
						<a type="button" href="https://github.com/Automattic/jetpack/issues/new" class="is-primary jp-form-button dops-button is-primary is-compact" >Report it!</a>
					</span>
				</span>
			</div>
		</div>

		<div class="dops-foldable-card is-expanded has-expanded-summary dops-card">
			<div class="dops-foldable-card__header has-border">
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text">Any Feedback?</div>
					</div>
				</span>
			</div>
			<div class="dops-foldable-card__content">
				<form >
					<fieldset class="jp-form-fieldset">
						<legend class="jp-form-legend" >
							<span><?php _e( 'Please help make Jetpack better', 'jetpack-beta' ); ?></span>
						</legend>
						<label class="jp-form-label">
							<textarea name="feedback" placeholder="<?php __( 'Your Report' ); ?>" rows="10" cols="50" id="feedback" class="large-text code"></textarea>
						</label>
						<input type="submit" class="is-primary jp-jetpack-connect__button dops-button" value="<?php _e( 'Send Feedback' ); ?>" />
					</fieldset>

				</form>
			</div>
		</div>


		<?php
	}

	/**
	 * Load styles for static page.
	 *
	 * @since 4.3.0
	 */
	function additional_styles() {
		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'dops-css', plugins_url( "_inc/build/admin.dops-style$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
		wp_enqueue_style( 'components-css', plugins_url( "_inc/build/style.min$rtl.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
	}

	// Javascript logic specific to the list table
	function page_admin_scripts() {
		wp_enqueue_script( 'jetpack-admin-js', plugins_url( '_inc/jetpack-admin.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), JETPACK__VERSION );
		?>
		<style>
			.jetpack_page_beta {
				background: #f3f6f8;
			}
		</style>
		<?php
	}
}
