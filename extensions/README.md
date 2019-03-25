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

Coming when [#11640](https://github.com/Automattic/jetpack/pull/11640) lands.

