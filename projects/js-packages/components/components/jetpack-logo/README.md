JetpackLogo
========

Component that renders the Jetpack SVG logo.
It consists of the Jetpack symbol followed by the name.
It takes width and height properties but defaults to 32px in height.

#### How to use:

```js
<JetpackLogo height={ 48 } className="jp-logo" />
```

#### Props

* `className`: String - (default: `jetpack-logo`) the class name set on the SVG element.
* `height`: Number - (default: 32) set the height of the logo.
* `width`: Number - (optional) set the width of the logo.
* `showText`: Boolean - (default: true) Whether to show text `Jetpack` after the logo.
* `logoColor`: String - (default: '#00BE28') The color of the logo symbol.
