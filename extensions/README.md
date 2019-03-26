# Jetpack Block Editor Extensions

This directory lists extensions for the Block Editor, also known as Gutenberg, [that was introduced in WordPress 5.0](https://wordpress.org/news/2018/12/bebo/).

## Extension Type

We define different types of block editor extensions:

- Blocks are available in the editor itself, and live in the `blocks` directory.
- Plugins are available in the Jetpack sidebar that appears on the right side of the block editor. Those live in the `plugins` directory.

When adding a new extension, add a new directory for your extension the matching directory.

## Extension Structure

Your extension should follow this structure:

```
.
└── blockname/
	└── blockname.php ← PHP file where the block and its assets are registered.
```

If your block depends on another block, place them all in extensions folder:

```
.
├── blockname/
└── sub-blockname/
```

**Note that this directory is still being populated. For now, you can find the blocks [here](https://github.com/Automattic/wp-calypso/tree/master/client/gutenberg/extensions).

## Develop new blocks

You can follow [the instructions here](../docs/guides/gutenberg-blocks.md) to add your own block to Jetpack.

## Block naming conventions

Blocks should use the `jetpack/` prefix, e.g. `jetpack/markdown`.
