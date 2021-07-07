# Jetpack Admin Footer

Component that renders Jetpack Admin Footer.
It takes moduleName and URL to show in the footer.

#### How to use:

```js
<JetpackFooter
	moduleName="Jetpack Search"
	aboutPageUrl="https://www.jetpack.com"
	className="jp-dashboard-footer"
/>
```

#### Props

- `className`: String - (default: `jp-dashboard-footer`) the class name set on the element.
- `aboutPageUrl`: String - (default: `https://www.jetpack.com`) link to be added on 'An Automattic Airline'.
- `moduleName`: String - (default: `Jetpack`) set the name of the Module, e.g. `Jetpack Search`.
