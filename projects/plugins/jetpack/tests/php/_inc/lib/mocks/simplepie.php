<?php // phpcs:disable WordPress.Files.FileName.InvalidClassFileName
/**
 * Implements a basic interface of the SimplePie classes in environments where it doesn't exist.
 *
 * @package automattic/jetpack
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

namespace SimplePie;

if ( class_exists( SimplePie::class ) ) {
	return;
}

if ( class_exists( \SimplePie::class ) ) {
	class_alias( \SimplePie::class, SimplePie::class );
	class_alias( \SimplePie_File::class, File::class );
	class_alias( \SimplePie_Item::class, Item::class );
	class_alias( \SimplePie_Locator::class, Locator::class );
	class_alias( \SimplePie_Enclosure::class, Enclosure::class );
} else {
	class SimplePie {
		/**
		 * Get a list or items.
		 *
		 * @return Item[]
		 */
		public function get_items() {
			return null;
		}
	}

	class File {
		public $body;

		/**
		 * Constructor
		 *
		 * Stores a response directly into the file body for similating feed markup.
		 *
		 * @param string $response Response body.
		 */
		public function __construct( $response ) {
			$this->body = $response;
		}
	}

	class Item {
		/**
		 * Returns ID.
		 *
		 * @return int
		 */
		public function get_id() {
			return null;
		}
	}

	class Locator {
		/**
		 * Overrides the locator is_feed function to check for
		 * appropriate podcast elements.
		 *
		 * @param SimplePie\File $file The file being checked.
		 * @param boolean        $check_html Adds text/html to the mimetypes checked.
		 */
		public function is_feed( $file, $check_html = false ) {
			return true;
		}
	}

	class Enclosure {
	}

	class_alias( SimplePie::class, \SimplePie::class );
	class_alias( File::class, \SimplePie_File::class );
	class_alias( Item::class, \SimplePie_Item::class );
	class_alias( Locator::class, \SimplePie_Locator::class );
	class_alias( Enclosure::class, \SimplePie_Enclosure::class );
}
