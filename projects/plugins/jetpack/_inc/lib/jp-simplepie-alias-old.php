<?php
/**
 * Class aliases for SimplePie.
 *
 * Core renamed the classes in 6.7, and for type declarations and such to work right we need to use the correct names.
 * This provides aliases for use with WordPress 6.6.
 *
 * @todo Remove this once we drop support for WordPress 6.6
 *
 * @package automattic/jetpack
 */

class_alias( SimplePie::class, Jetpack\SimplePie\SimplePie::class );
class_alias( SimplePie_File::class, Jetpack\SimplePie\File::class );
class_alias( SimplePie_Item::class, Jetpack\SimplePie\Item::class );
class_alias( SimplePie_Locator::class, Jetpack\SimplePie\Locator::class );
class_alias( SimplePie_Enclosure::class, Jetpack\SimplePie\Enclosure::class );
