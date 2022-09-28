JetpackSearchLogo
========

Component that renders the Jetpack SVG logo.
It consists of the Jetpack symbol followed by the name.
It takes width and height properties but defaults to 42px in height.

#### How to use:

```js
<JetpackSearchLogo className="jp-logo" />
```

#### Props

* `className`: String - (default: `jetpack-logo`) the class name set on the SVG element.
* `height`: Number - (default: 42) set the height of the logo.
* `width`: Number - (default: 330) set the width of the logo.
* `pluginName`: String - (default: `search`) Whether to show plugin name `Search` after the logo.
* `logoColor`: String - (default: '#069e08') The color of the logo symbol.
