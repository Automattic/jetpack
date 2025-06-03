# Block Delimiter

Efficiently work with block structure

## How to install block-delimiter

To use this package in your WordPress plugin, you can require both this package and the [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) in your project's `composer.json` file.

## Usage

The Block Delimiter package provides an efficient, streaming parser for working with WordPress block structure without the memory overhead of `parse_blocks()`. It's designed for scenarios where you need to inspect, find, or modify specific blocks without parsing the entire block tree.

### Basic Block Scanning

Find and iterate through all block delimiters in a document:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph -->
<p>Hello world!</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":123} -->
<figure><img src="example.jpg" /></figure>
<!-- /wp:image -->';

foreach ( Block_Delimiter::scan_delimiters( $post_content ) as $where => $delimiter ) {
    // $where is an array: [ byte_offset, byte_length ]
    // $delimiter is a Block_Delimiter instance
    
    echo "Found block: " . $delimiter->allocate_and_return_block_type() . "\n";
    echo "Type: " . $delimiter->get_delimiter_type() . "\n";
}
```

**Output:**
```
Found block: core/paragraph
Type: opener
Found block: core/paragraph
Type: closer
Found block: core/image
Type: opener
Found block: core/image
Type: closer
```

### Finding Specific Block Types

Efficiently find blocks of a specific type without parsing everything:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph -->
<p>Welcome to my blog!</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":456} -->
<figure><img src="photo.jpg" /></figure>
<!-- /wp:image -->
<!-- wp:gallery {"ids":[789,101]} -->
<figure class="wp-block-gallery">...</figure>
<!-- /wp:gallery -->';

// Find the first image block
foreach ( Block_Delimiter::scan_delimiters( $post_content ) as $delimiter ) {
    if ( ! $delimiter->is_block_type( 'image' ) ) {
        continue;
    }
    
    if ( Block_Delimiter::OPENER === $delimiter->get_delimiter_type() ) {
        $attributes = $delimiter->allocate_and_return_parsed_attributes();
        if ( isset( $attributes['id'] ) ) {
            echo "Found image with ID: " . $attributes['id'];
            break;
        }
    }
}
```

**Output:**
```
Found image with ID: 456
```

### Extracting Block Attributes

Parse JSON attributes only when needed:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">This paragraph has a large font size.</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p>This paragraph has no custom font size.</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"fontSize":"small","textColor":"primary"} -->
<p class="has-primary-color has-small-font-size">This paragraph has a small font size and primary color.</p>
<!-- /wp:paragraph -->';

foreach ( Block_Delimiter::scan_delimiters( $post_content ) as $delimiter ) {
    if ( $delimiter->is_block_type( 'core/paragraph' ) && 
         Block_Delimiter::OPENER === $delimiter->get_delimiter_type() ) {
        
        $attributes = $delimiter->allocate_and_return_parsed_attributes();
        if ( isset( $attributes['fontSize'] ) ) {
            echo "Paragraph with font size: " . $attributes['fontSize'] . "\n";
        }
    }
}
```

**Output:**
```
Paragraph with font size: large
Paragraph with font size: small
```

### Counting Block Types

Get a summary of all block types in a document:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:heading {"level":2} -->
<h2>My Blog Post</h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Introduction paragraph.</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":123} -->
<figure><img src="hero.jpg" /></figure>
<!-- /wp:image -->
<!-- wp:paragraph -->
<p>Another paragraph.</p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul><li>Item 1</li><li>Item 2</li></ul>
<!-- /wp:list -->';

function get_block_types_in( string $html ): array {
    $block_types = [];
    
    foreach ( Block_Delimiter::scan_delimiters( $html ) as $delimiter ) {
        if ( Block_Delimiter::OPENER === $delimiter->get_delimiter_type() ) {
            $block_types[ $delimiter->allocate_and_return_block_type() ] = true;
        }
    }
    
    $block_types = array_keys( $block_types );
    sort( $block_types );
    return $block_types;
}

$block_types = get_block_types_in( $post_content );
print_r( $block_types );
```

**Output:**
```
Array
(
    [0] => core/heading
    [1] => core/image
    [2] => core/list
    [3] => core/paragraph
)
```

### Extracting Complete Block Content

Extract an entire block including its delimiters and content:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph -->
<p>First paragraph.</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3} -->
<h3>Section Title</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Second paragraph with more content.</p>
<!-- /wp:paragraph -->';

function extract_block( string $block_name, string $html ): ?string {
    $depth = 0;
    $starts_at = null;
    
    foreach ( Block_Delimiter::scan_delimiters( $html ) as $where => $delimiter ) {
        if ( ! $delimiter->is_block_type( $block_name ) ) {
            continue;
        }
        
        switch ( $delimiter->get_delimiter_type() ) {
            case Block_Delimiter::VOID:
                return substr( $html, $where[0], $where[1] );
                
            case Block_Delimiter::OPENER:
                $depth++;
                $starts_at = $starts_at ?? $where[0];
                break;
                
            case Block_Delimiter::CLOSER:
                if ( --$depth === 0 ) {
                    return substr( $html, $starts_at, $where[0] + $where[1] - $starts_at );
                }
        }
    }
    
    return null;
}

$heading_block = extract_block( 'heading', $post_content );
echo $heading_block;
```

**Output:**
```
<!-- wp:heading {"level":3} -->
<h3>Section Title</h3>
<!-- /wp:heading -->
```

### Modifying Block Content

Transform block content efficiently without parsing the entire tree:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph -->
<p>Some text content.</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":123} -->
<figure class="wp-block-image"><img src="photo1.jpg" /></figure>
<!-- /wp:image -->
<!-- wp:paragraph -->
<p>More text content.</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":456} -->
<figure class="wp-block-image"><img src="photo2.jpg" /></figure>
<!-- /wp:image -->';

function add_css_class_to_images( string $post_content, string $css_class ): string {
    $output = '';
    $starts_at = null;
    $was_at = 0;
    
    foreach ( Block_Delimiter::scan_delimiters( $post_content ) as $where => $delimiter ) {
        if ( ! $delimiter->is_block_type( 'image' ) ) {
            continue;
        }
        
        list( $at, $length ) = $where;
        
        if ( Block_Delimiter::OPENER === $delimiter->get_delimiter_type() ) {
            $starts_at = $at + $length;
        } elseif ( Block_Delimiter::CLOSER === $delimiter->get_delimiter_type() ) {
            // Copy untouched content before this block
            $output .= substr( $post_content, $was_at, $starts_at - $was_at );
            
            // Transform the block content
            $block_content = substr( $post_content, $starts_at, $at - $starts_at );
            $output .= add_css_class( $block_content, $css_class );
            
            $was_at = $at;
        }
    }
    
    // Add any remaining content
    $output .= substr( $post_content, $was_at );
    return $output;
}

function add_css_class( string $html, string $css_class ): string {
    // Simple example - add class to figure elements
    return str_replace( 'class="wp-block-image"', 'class="wp-block-image ' . $css_class . '"', $html );
}

$modified_content = add_css_class_to_images( $post_content, 'custom-image-style' );
echo $modified_content;
```

**Output:**
```
<!-- wp:paragraph -->
<p>Some text content.</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":123} -->
<figure class="wp-block-image custom-image-style"><img src="photo1.jpg" /></figure>
<!-- /wp:image -->
<!-- wp:paragraph -->
<p>More text content.</p>
<!-- /wp:paragraph -->
<!-- wp:image {"id":456} -->
<figure class="wp-block-image custom-image-style"><img src="photo2.jpg" /></figure>
<!-- /wp:image -->
```

### Error Handling

Check for parsing errors:

```php
use Automattic\Block_Delimiter;

$post_content = '<!-- wp:paragraph {"invalid": json} -->
<p>This block has invalid JSON attributes.</p>
<!-- /wp:paragraph -->
<!-- wp:image -->
<figure><img src="valid.jpg" /></figure>
<!-- /wp:image -->';

foreach ( Block_Delimiter::scan_delimiters( $post_content ) as $delimiter ) {
    if ( Block_Delimiter::OPENER === $delimiter->get_delimiter_type() ) {
        $attributes = $delimiter->allocate_and_return_parsed_attributes();
        if ( null === $attributes && $delimiter->get_last_json_error() !== JSON_ERROR_NONE ) {
            echo "Invalid JSON in " . $delimiter->allocate_and_return_block_type() . " block\n";
        } elseif ( is_array( $attributes ) ) {
            echo "Valid " . $delimiter->allocate_and_return_block_type() . " block\n";
        } else {
            echo "No attributes in " . $delimiter->allocate_and_return_block_type() . " block\n";
        }
    }
}

// Check for incomplete input
$incomplete_content = '<!-- wp:paragraph';
$delimiter = Block_Delimiter::next_delimiter( $incomplete_content, 0 );

if ( null === $delimiter ) {
    $error = Block_Delimiter::get_last_error();
    if ( Block_Delimiter::INCOMPLETE_INPUT === $error ) {
        echo "Document appears to be truncated\n";
    }
}
```

**Output:**
```
Invalid JSON in core/paragraph block
No attributes in core/image block
Document appears to be truncated
```

### Performance Benefits

The Block Delimiter approach offers significant performance advantages:

- **Zero memory overhead**: No block tree construction
- **Streaming processing**: Process only what you need
- **Lazy parsing**: JSON attributes parsed only when accessed
- **String-based operations**: Work directly with the source text
- **Early termination**: Stop processing when you find what you need

This makes it ideal for operations like finding specific blocks, counting block types, or making targeted modifications without the cost of full block tree parsing.

## Contribute

You can contribute to this package by submitting a pull request to the [Jetpack repository](https://github.com/Automattic/jetpack/tree/trunk/projects/packages/block-delimiter).

### Coding standards

This package follows standards set by the [Jetpack Codesniffer package](https://packagist.org/packages/automattic/jetpack-codesniffer), with a few exceptions documented in the package's `.phpcs.dir.xml` file.

### Testing

When introducing new features or making changes to existing code, please add tests.

To run the tests, you can use the following command:

```bash
composer phpunit
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Block Delimiter is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
