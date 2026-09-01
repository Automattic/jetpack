<?php
/**
 * Shared preset arrays for the Create AI Podcast page.
 *
 * Values mirror what `dashboard/create/presets.ts` exported before the page
 * moved to this stack. PHP renders the form's <select> options from these
 * arrays; the JS island receives the same arrays via wp_localize_script so
 * status notices can label runs by preset id.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Admin_Pages\Create_AI_Podcast;

/**
 * Date-range presets for the "from a window" source mode.
 *
 * @return array<int, array{id:string,label:string,unit:string,n:int}>
 */
function window_presets(): array {
	return array(
		array(
			'id'    => 'last-7-days',
			'label' => __( 'Last 7 days', 'jetpack-podcast' ),
			'unit'  => 'days',
			'n'     => 7,
		),
		array(
			'id'    => 'last-14-days',
			'label' => __( 'Last 14 days', 'jetpack-podcast' ),
			'unit'  => 'days',
			'n'     => 14,
		),
		array(
			'id'    => 'last-30-days',
			'label' => __( 'Last 30 days', 'jetpack-podcast' ),
			'unit'  => 'days',
			'n'     => 30,
		),
		array(
			'id'    => 'last-3-months',
			'label' => __( 'Last 3 months', 'jetpack-podcast' ),
			'unit'  => 'months',
			'n'     => 3,
		),
	);
}

/**
 * Episode-length presets.
 *
 * @return array<int, array{id:string,label:string}>
 */
function length_presets(): array {
	return array(
		array(
			'id'    => 'short',
			'label' => __( 'Short (~3 min)', 'jetpack-podcast' ),
		),
		array(
			'id'    => 'medium',
			'label' => __( 'Medium (~7 min)', 'jetpack-podcast' ),
		),
		array(
			'id'    => 'long',
			'label' => __( 'Long (~12 min)', 'jetpack-podcast' ),
		),
	);
}

/**
 * Voice-style presets.
 *
 * @return array<int, array{id:string,label:string}>
 */
function voice_presets(): array {
	return array(
		array(
			'id'    => 'witty',
			'label' => __( 'Witty', 'jetpack-podcast' ),
		),
		array(
			'id'    => 'earnest',
			'label' => __( 'Earnest', 'jetpack-podcast' ),
		),
		array(
			'id'    => 'professional',
			'label' => __( 'Professional', 'jetpack-podcast' ),
		),
	);
}
