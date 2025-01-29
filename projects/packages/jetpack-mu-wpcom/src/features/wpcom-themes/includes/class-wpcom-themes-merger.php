<?php
/**
 * Class WPCom_Themes_Merger.
 * Responsible for the different merging strategies between WPCom and WPOrg themes.
 *
 * @package wpcom-themes
 */

/**
 * Merges theme objects between WPCom and WPOrg repositories.
 */
class WPCom_Themes_Merger {
	/**
	 * Merges themes prioritizing WPCom themes.
	 *
	 * @param stdClass $wporg_themes_object The WP.org themes API result.
	 * @param array    $wpcom_themes        The WP.com themes to include.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function merge_by_wpcom_first( stdClass $wporg_themes_object, array $wpcom_themes ): stdClass {
		$wporg_themes_excluding_wpcom = array();

		// Create an associative array with theme slugs as keys for quick lookup
		$wpcom_theme_slugs = array_flip(
			array_map(
				fn ( $theme ) => $theme->slug,
				$wpcom_themes
			)
		);

		// Filter themes from $wporg_themes_object that are not in $wpcom_themes
		foreach ( $wporg_themes_object->themes as $wporg_theme ) {
			if ( ! isset( $wpcom_theme_slugs[ $wporg_theme->slug ] ) ) {
				$wporg_themes_excluding_wpcom[] = $wporg_theme;
			}
		}

		// Remove the count of wporg themes.
		$wporg_themes_object->info['results'] -= count( $wporg_themes_object->themes );

		// Merge $wpcom_themes and $wporg_themes_excluding_wpcom if it's the first page
		if ( $wporg_themes_object->info['page'] === 1 ) {
			$wporg_themes_object->themes = array_merge( $wpcom_themes, $wporg_themes_excluding_wpcom );
		}

		// Add the count of themes without duplicates.
		$wporg_themes_object->info['results'] += count( $wporg_themes_object->themes );

		return $wporg_themes_object;
	}

	/**
	 * Merge themes by release date with no particular bias.
	 *
	 * @param stdClass $wporg_themes_object The WP.org themes API result.
	 * @param array    $wpcom_themes        The WP.com themes to include.
	 *
	 * @return stdClass The themes API result including wpcom themes.
	 */
	public function merge_by_release_date( stdClass $wporg_themes_object, array $wpcom_themes ): stdClass {
		$last_theme_date  = strtotime( end( $wporg_themes_object->themes )->creation_time );
		$first_theme_date = strtotime( reset( $wporg_themes_object->themes )->creation_time );

		$themes = array();
		foreach ( $wporg_themes_object->themes as $wporg_theme ) {
			$themes[ $wporg_theme->slug ] = $wporg_theme;
		}

		// We override WP.org themes with WP.com themes if they have the same slug. We might have fewer results
		// than expected if there are themes with the same slug in both repositories and the release dates differ.
		// As a general rule, users will see themes once they're available on the WPCom theme repo which is before they're
		// available on the WPOrg theme repo.
		foreach ( $wpcom_themes as $theme ) {
			$themes[ $theme->slug ] = $theme;
		}

		$themes = array_filter(
			$themes,
			fn( $theme ) => strtotime( $theme->creation_time ) >= $last_theme_date && strtotime( $theme->creation_time ) <= $first_theme_date
		);

		usort(
			$themes,
			fn( $a, $b ) => strtotime( $b->creation_time ) - strtotime( $a->creation_time )
		);

		// Remove the wporg themes count.
		$wporg_themes_object->info['results'] -= count( $wporg_themes_object->themes );
		// Add the filtered unique themes count.
		$wporg_themes_object->info['results'] += count( $themes );

		$wporg_themes_object->themes = $themes;

		return $wporg_themes_object;
	}
}
