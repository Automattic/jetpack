<?php
/**
 * Server-side rendering for the form progress indicator block.
 *
 * Template variables provided by WordPress block render context:
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 *
 * @package jetpack-forms
 */

$max_steps = \Automattic\Jetpack\Extensions\Contact_Form\Contact_Form_Block::get_form_step_count();

// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
$variant       = isset( $attributes['variant'] ) ? $attributes['variant'] : 'line';
$is_dots_style = $variant === 'dots';

// Build custom CSS variables for progress indicator colors
$custom_styles = array();

if ( isset( $attributes['progressColor'] ) ) {
	$custom_styles[] = '--jp-progress-active-color: ' . esc_attr( $attributes['progressColor'] ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
}

if ( isset( $attributes['progressBackgroundColor'] ) ) {
	$custom_styles[] = '--jp-progress-track-color: ' . esc_attr( $attributes['progressBackgroundColor'] ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
}

if ( isset( $attributes['textColor'] ) ) {
	$custom_styles[] = '--jp-progress-text-color: var(--wp--preset--color--' . esc_attr( $attributes['textColor'] ) . ')'; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
} elseif ( isset( $attributes['style']['color']['text'] ) ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
	$custom_styles[] = '--jp-progress-text-color: ' . esc_attr( $attributes['style']['color']['text'] ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.
}

// Use WordPress Style Engine for block supports (dimensions, spacing, background, etc.)
$generated_styles = wp_style_engine_get_styles( $attributes['style'] ?? array() ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $attributes is provided by WordPress.

$generated_css_parts = ! empty( $generated_styles['css'] ) ? explode( ';', $generated_styles['css'] ) : array();
$all_styles          = array_filter( array_merge( $custom_styles, $generated_css_parts ) );

$extra_attributes = array();
if ( ! empty( $all_styles ) ) {
	$extra_attributes['style'] = implode( '; ', $all_styles );
}

// Add generated classnames if any
$classes = array();
if ( ! empty( $generated_styles['classnames'] ) ) {
	$classes[] = $generated_styles['classnames'];
}
// Add variant class
$classes[] = 'is-variant-' . $variant;

$extra_attributes['class'] = implode( ' ', $classes );

$wrapper_attributes = get_block_wrapper_attributes( $extra_attributes );

// The progress indicator inherits context from the parent form
// No need to set up its own context as it should use the form's shared context

// Build the complete HTML structure
$progress_state = $is_dots_style ? 'state.getDotsProgress' : 'state.getStepProgress';
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>
	data-wp-interactive="jetpack/form">
	<div class="jetpack-form-progress-indicator-steps">
		<?php if ( $is_dots_style ) : ?>
			<?php for ( $i = 0; $i < $max_steps; $i++ ) : ?>
				<?php $step_context = array( 'stepIndex' => $i ); ?>
				<div class="jetpack-form-progress-indicator-step"
					data-wp-class--is-active="state.isStepActive"
					data-wp-class--is-completed="state.isStepCompleted"
					data-wp-context='<?php echo wp_json_encode( $step_context ); ?>'>
					<div class="jetpack-form-progress-indicator-line"></div>
					<div class="jetpack-form-progress-indicator-dot">
						<span class="jetpack-form-progress-indicator-step-number">
							<span class="step-number"><?php echo esc_html( $i + 1 ); ?></span>
							<span class="step-checkmark" role="img" aria-label="<?php echo esc_attr__( 'Completed', 'jetpack-forms' ); ?>">
								<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" fill="currentColor"/>
								</svg>
							</span>
						</span>
					</div>
				</div>
			<?php endfor; ?>
		<?php endif; ?>
		<div class="jetpack-form-progress-indicator-progress"
			data-wp-style--width="<?php echo esc_attr( $progress_state ); ?>"></div>
	</div>
</div>