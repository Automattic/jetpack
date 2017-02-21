<div class="beta-container" >
	<div class="dops-foldable-card is-expanded has-expanded-summary dops-card is-compact">
		<div class="dops-foldable-card__header has-border">
			<span class="dops-foldable-card__main">
				<div class="dops-foldable-card__header-text">
					<div class="dops-foldable-card__header-text">Jetpack Beta</div>

				</div>
			</span>
		</div>
		<div class="dops-foldable-card__content">
			<?php echo $this->get_jetpack_plugin_version(); ?>
		</div>
	</div>
	<?php
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
					<a type="button" href="https://github.com/Automattic/jetpack/issues/new" class="is-primary jp-form-button dops-button is-primary is-compact" >Report it!</a>
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
