# JetpackSymbol

Component that renders the Jetpack SVG logo only without the `Jetpack` text.
It consists of the Jetpack symbol only.
It takes width and height properties but defaults to 16px in height.

#### How to use:

```js
<JetpackSymbol height={ 32 } className="jetpack-symbol" />
```

#### Props

- `color`: String - (default: '#00BE28'), filled color
- `className`: String - (default: `jetpack-symbol`) the class name set on the SVG element.
- `height`: Number - (default: 16) set the height of the logo.
- `width`: Number - (optional) set the width of the logo.
