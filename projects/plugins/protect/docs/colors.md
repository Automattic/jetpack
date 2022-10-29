# Colors

Jetpack Protect uses the `@automattic/color-studio` package for managing colors.

You can view the interactive color studio pallete via [color-studio.blog](https://color-studio.blog).

For more information on color studio, see the [package README](./../node_modules/@automattic/color-studio/README.md).

## CSS

Color studio properties are loaded in the root stylesheet:

```scss
// ./src/js/styles.module.scss
@import "~@automattic/color-studio/dist/color-properties";
```
Properties can be used in any project stylesheet like so:

```scss
.foo {
    color: var( --studio-jetpack-green-50 );
}
```

A full list of color properties can be found in [the package source](./../node_modules/@automattic/color-studio/dist/color-properties.css).

## JavaScript

Colors can be accessed by requiring the package:

```javascript
const PALETTE = require('@automattic/color-studio');

console.log( PALETTE.colors['Jetpack Green 50'] )
```