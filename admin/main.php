<div class="jetpack-beta__master-head">
	<div class="jetpack-beta-container">
		<a class="jp-masthead__logo-link" href="<?php echo esc_url( $this->settings_link() ); ?>"><svg class="jetpack-beta-logo" x="0" y="0" viewBox="0 0 183 32"><path d="M54 10.9v4.8 2.6c0 2.2-0.5 4.3-1.5 5.4 -1.3 1.4-3.3 1.9-5.5 1.9 -3.4 0-5.9-2.6-6-2.7l2-4c0.2 0.2 0.7 1.1 2 1.7 1.2 0.6 2.2 0.8 3 0.3 0.8-0.5 1-2 1-3v-6.1L44 7h6C52.2 7 54 8.7 54 10.9zM81 10.9h5V25h5V10.9h5V7H81V10.9zM115 8.9c1.1 1.1 2 2.8 2 4.6 0 2.1-1 3.8-2.2 4.9 -1.2 1.1-3 1.6-5.1 1.6h-2.6v5H102V7h7.8C112.1 7 113.8 7.7 115 8.9zM112.4 13.4c0-0.9-0.6-1.5-1-1.9 -0.6-0.5-1.4-0.6-2.1-0.6h-2.3V16h2.3c0.7 0 1.4-0.1 2-0.5C111.8 15.1 112.4 14.4 112.4 13.4zM135.8 8.9c1.4 1.4 2.1 3.5 2.1 5.4V25h-5v-5h-6v5h-5V14.3c0-1.9 0.7-4 2.1-5.4 1.3-1.3 3.4-2.4 5.9-2.4C132.5 6.5 134.6 7.7 135.8 8.9zM132.5 12c-0.7-0.7-1.6-1-2.5-1 -0.9 0-1.9 0.3-2.5 1 -0.5 0.6-0.5 1.5-0.5 2.6V16h6v-1.4C132.9 13.5 133 12.6 132.5 12zM61.1 25H75v-3.9h-9v-3.2h7V14h-7v-3.1h9V7H61.1V25zM157.6 20c-0.1 0-0.2 0.1-0.3 0.1 0 0 0 0 0 0 -1 0.5-2.1 0.8-3.4 0.8 -1.5 0-2.9-0.5-3.8-1.5 -1-0.9-1.5-2.2-1.5-3.8 0-1.3 0.5-2.5 1.2-3.4 0.9-1.1 2.3-1.8 4.1-1.8 1 0 1.8 0.2 2.7 0.5 0 0 0.1 0 0.2 0.1 0.1 0 0.2 0.1 0.3 0.1 0 0 0.1 0 0.1 0.1 0.1 0 0.1 0.1 0.2 0.1 0.2 0.1 0.4 0.2 0.6 0.3l1.7-3.6c-0.3-0.2-0.7-0.4-1.1-0.6 -1.3-0.6-2.8-1-4.9-1 -2.8 0-5.5 1.2-7.3 3.1 -1.5 1.6-2.4 3.7-2.4 6.1 0 2.9 1.1 5.2 2.8 6.8 1.7 1.6 4.1 2.5 6.9 2.5 2.3 0 4-0.5 5.4-1.3 0 0 0.1 0 0.1 0 0 0 0 0 0 0 0.2-0.1 0.5-0.3 0.7-0.4l-1.8-3.6C157.9 19.8 157.7 19.9 157.6 20zM182 7h-5.8l-5.2 5.7V7h-3v0h-2v18h2 2.4 0.6v-6.5l0.5-0.5 5.3 7h5.2l-7.5-10.1L182 7zM32 16c0 8.8-7.2 16-16 16S0 24.8 0 16C0 7.2 7.2 0 16 0S32 7.2 32 16zM15 4.7L8.7 15.5c-0.7 1.1 0 2.6 1.2 2.9l5 1.3V4.7zM22 13.5l-5-1.3v15l6.3-10.8C23.9 15.3 23.3 13.9 22 13.5z" ></path></svg>
			<span>Beta Tester</span></a>
	</div>
</div>
<div class="jetpack-beta-container" >
	<?php if ( Jetpack_Beta::get_option() ) {?>
	<div class="dops-foldable-card is-expanded has-expanded-summary dops-card is-compact">
		<div class="dops-foldable-card__header has-border">
			<span class="dops-foldable-card__main">
				<div class="dops-foldable-card__header-text">
					<div class="dops-foldable-card__header-text">Currently Running </div>
				</div>
			</span>
		</div>
		<div class="dops-foldable-card__content">
			<p><?php echo Jetpack_Beta::get_jetpack_plugin_pretty_version(); ?> | <?php echo Jetpack_Beta::get_jetpack_plugin_version(); ?></p>
		</div>
	</div>
	<?php } else {
		Jetpack_Beta_Admin::start_notice();
	}
	if ( $to_test = $this->to_test_content() ) { ?>
		<div class="dops-foldable-card is-expanded has-expanded-summary dops-card is-compact">
			<div class="dops-foldable-card__header has-border">
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text"><?php _e( 'To Test', 'jetpack-beta' ); ?></div>
					</div>
				</span>
			</div>
			<div class="dops-foldable-card__content">
				<?php echo $to_test ; ?>
			</div>
		</div>
	<?php } ?>

	<div class="dops-foldable-card has-expanded-summary dops-card">
		<div class="dops-foldable-card__header has-border">
			<span class="dops-foldable-card__main">
				<div class="dops-foldable-card__header-text">
					<div class="dops-foldable-card__header-text"><?php _e( 'Found a bug?', 'jetpack-beta' ); ?></div>
					<div class="dops-foldable-card__subheader"><?php _e( 'We would love to hear about it', 'jetpack-beta' ); ?></div>
				</div>
			</span>
			<span class="dops-foldable-card__secondary" >
				<span class="dops-foldable-card__summary">
					<a type="button" href="<?php echo esc_url( JETPACK_BETA_REPORT_URL ); ?>" class="is-primary jp-form-button dops-button is-primary is-compact" >Report it!</a>
				</span>
			</span>
		</div>
	</div>
<!--	<div class="dops-foldable-card is-expanded has-expanded-summary dops-card">-->
<!--		<div class="dops-foldable-card__header has-border">-->
<!--			<span class="dops-foldable-card__main">-->
<!--				<div class="dops-foldable-card__header-text">-->
<!--					<div class="dops-foldable-card__header-text">Any Feedback?</div>-->
<!--				</div>-->
<!--			</span>-->
<!--		</div>-->
<!--		<div class="dops-foldable-card__content">-->
<!--			<form >-->
<!--				<fieldset class="jp-form-fieldset">-->
<!--					<legend class="jp-form-legend" >-->
<!--						<span>--><?php //_e( 'Please help make Jetpack better', 'jetpack-beta' ); ?><!--</span>-->
<!--					</legend>-->
<!--					<label class="jp-form-label">-->
<!--						<textarea name="feedback" placeholder="--><?php //__( 'Your Report' ); ?><!--" rows="10" cols="50" id="feedback" class="large-text code"></textarea>-->
<!--					</label>-->
<!--					<input type="submit" class="is-primary jp-jetpack-connect__button dops-button" value="--><?php //_e( 'Send Feedback' ); ?><!--" />-->
<!--				</fieldset>-->
<!---->
<!--			</form>-->
<!--		</div>-->
<!--	</div>-->
	<?php

	$this->stable_branch();
	$this->show_branch( __( 'Bleeding Edge' ), 'master', null, 'master' );
	$this->show_branches( 'rc',  __( 'RC', 'jetpack-beta' ) );
	$this->render_search();
	$this->show_branches( 'pr' );
	?>
</div>
