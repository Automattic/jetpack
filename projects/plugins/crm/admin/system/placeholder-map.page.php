<?php
/*
!
 * System Assistant: Placeholder map page
 */

global $zbs;

$placeholders_class = $zbs->get_templating();
$placeholders       = $placeholders_class->get_placeholders();

jpcrm_render_system_title( __( 'Placeholders', 'zero-bs-crm' ) );

/**
 * Render a single placeholder
 */
function jpcrm_render_placeholder_line( $placeholder_key = '', $placeholder_info = array() ) {

	?><div class="ui segment">

		<h4 class="ui dividing header"><code><?php echo esc_html( $placeholder_key ); ?></code> - 
														<?php
														if ( isset( $placeholder_info['description'] ) ) {
															echo esc_html( $placeholder_info['description'] );}
														?>
		</h4>

		<?php

			// got expected format?
		if ( isset( $placeholder_info['expected_format'] ) ) {

			$format_prefix = '<p>' . esc_html__( 'Format', 'zero-bs-crm' ) . ': <span class="ui label">';
			$format_suffix = '</span></p>';

			switch ( $placeholder_info['expected_format'] ) {

				case 'str':
				case 'text':
				case 'textarea':
				case 'checkbox':
				case 'select':
				case 'radio':
					echo $format_prefix . esc_html__( 'Text String', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'tel':
					echo $format_prefix . esc_html__( 'Telephone', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'email':
					echo $format_prefix . esc_html__( 'Email', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'uts':
					echo $format_prefix . esc_html__( 'Unix Timestamp / Date', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'int':
				case 'float':
				case 'numberint':
				case 'numberfloat':
					echo $format_prefix . esc_html__( 'Number', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'bool':
					echo $format_prefix . esc_html__( 'Boolean', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'html':
					echo $format_prefix . esc_html__( 'HTML', 'zero-bs-crm' ) . $format_suffix;
					break;
				case 'curr':
					echo $format_prefix . esc_html__( 'Currency String (e.g. USD)', 'zero-bs-crm' ) . $format_suffix;
					break;

				default:
					// ?
					break;

			}
		}

			// got available in?
		if ( isset( $placeholder_info['available_in'] ) && count( $placeholder_info['available_in'] ) > 0 ) {

			echo '<p>' . esc_html__( 'Available in areas', 'zero-bs-crm' ) . ': ';

			$available_in_count = 0;

			foreach ( $placeholder_info['available_in'] as $available_in ) {

				if ( $available_in_count > 0 ) {
					echo ', ';
				}

				echo '<span class="ui label blue">' . esc_html__( ucwords( $available_in ), 'zero-bs-crm' ) . '</span>';

				++$available_in_count;

			}

			echo '</p>';
		}

			// got aliases?
		if ( isset( $placeholder_info['aliases'] ) && count( $placeholder_info['aliases'] ) > 0 ) {

			echo '<p>' . esc_html__( 'Aliases', 'zero-bs-crm' ) . ': ';

			$alias_count = 0;

			foreach ( $placeholder_info['aliases'] as $alias ) {

				if ( $alias_count > 0 ) {
					echo ', ';
				}

				echo '<span class="ui label yellow">' . esc_html( $alias ) . '</span>';

				++$alias_count;

			}

			echo '</p>';
		}

		?>

	</div>
	<?php
}

?>
<p><?php esc_html_e( 'Throughout the CRM you can use various placeholders to represent fields (e.g. in quote templates or when sending out emails). This page lists all placeholders which are available to you with your current setup.', 'zero-bs-crm' ); ?></p>

<div class="ui styled fluid accordion">
  
	<?php

		$active_group = '';

	if ( is_array( $placeholders ) ) {

		foreach ( $placeholders as $placeholder_group_key => $placeholder_group ) {

			// heading, e.g. contacts
			?>
				<div class="title"><i class="dropdown icon"></i> <?php echo esc_html( ucwords( __( $placeholder_group_key, 'zero-bs-crm' ) ) ); ?></div><div class="
				<?php
				if ( $active_group == $placeholder_group_key ) {
					echo 'active'; }
				?>
content">
				<?php

				$placeholder_group_prefix = '';

				// all objtypes basically
				if ( $zbs->DAL->isValidObjTypeID( $zbs->DAL->objTypeID( $placeholder_group_key ) ) ) {

					// $placeholder_group_prefix = $placeholder_group_key . '-';

				}

				foreach ( $placeholder_group as $placeholder_key => $placeholder ) {

					$key = '##' . strtoupper( $placeholder_group_prefix . $placeholder_key ) . '##';

					// render
					jpcrm_render_placeholder_line( $key, $placeholder );

				}

				?>
				</div>
				<?php

		}
	}

	?>

</div>
