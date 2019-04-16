# Jetpack Block Editor Extensions

This directory lists extensions for the Block Editor, also known as Gutenberg,
[that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

## Extension Type

We define different types of block editor extensions:

- Blocks are available in the editor itself.
- Plugins are available in the Jetpack sidebar that appears on the right side of the block editor.

## Extension Structure

Extensions loosely follow this structure:

```
.
└── block-or-plugin-name/
	├── block-or-plugin-name.php ← PHP file where the block and its assets are registered.
	├── editor.js                ← script loaded only in the editor
	├── editor.scss              ← styles loaded only in the editor
	├── view.js                  ← script loaded in the editor and theme
	└── view.scss                ← styles loaded in the editor and theme
```

If your block depends on another block, place them all in extensions folder:

```
.
├── block-name/
└── sub-blockname/
```

## Develop new blocks

We have a command in WP-CLI that allows to scaffold Jetpack blocks. Its syntax is as follows:

`wp jetpack scaffold <type> <title> [--slug] [--description] [--keywords]`

**Currently the only `type` is `block`.**

### Options

- **title**: Block name, also used to create the slug. This parameter is required. If it's something like _Logo gallery_, the slug will be `logo-gallery`. It's also used to generate the class name when an external edit component is requested. Following this example, it would be `LogoGalleryEdit`.
- **--slug**: Specific slug to identify the block that overrides the one generated base don the title.
- **--description**: Allows to provide a text description of the block.
- **--keywords**: Provide up to three keywords separated by comma so users  when they search for a block in the editor.

### Files

All files will be created in a directory under `extensions/blocks/` named after the block title or a specific given slug. For a hypothetical **Jukebox** block, it will create the following files

- `extensions/blocks/jukebox/`
- `extensions/blocks/jukebox/jukebox.php`
- `extensions/blocks/jukebox/index.js`
- `extensions/blocks/jukebox/editor.js`
- `extensions/blocks/jukebox/editor.scss`
- `extensions/blocks/jukebox/edit.js`

Additionally, the slug of the new block will be added to the `beta` array in the file `extensions/index.json`.

### Examples

`wp jetpack scaffold block "Cool Block"`

`wp jetpack scaffold block "Amazing Rock" --slug="good-music" --description="Rock the best music on your site"`

`wp jetpack scaffold block "Jukebox" --keywords="music, audio, media"`


### Loading beta blocks

When you run the scaffolding, the block is added to the beta list, and you need to tell Jetpack to load the beta blocks. You do this by adding the following:

`define( 'JETPACK_BETA_BLOCKS', true );`

in your `wp-config.php`, before the `/* That's all, stop editing! Happy blogging. */`.

### Building the blocks

Run 

`yarn build-extensions`

for a one time build, or

`yarn build-extensions --watch`

to watch the files and build continuously. 
