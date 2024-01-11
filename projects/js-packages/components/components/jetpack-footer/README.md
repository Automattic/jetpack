# Jetpack Admin Footer

Component that renders Jetpack Admin Footer.
It takes moduleName and URL to show in the footer.

## How to use:

```js
<JetpackFooter moduleName="Jetpack Search" className="jp-dashboard-footer" />
```

## Props

- `className`: String - (default: `jp-dashboard-footer`) the additional class name set on the element.
- `moduleName`: String - (default: `Jetpack`) set the name of the Module, e.g. `Jetpack Search`.
- `moduleNameHref`: String - (default: `https://jetpack.com`) link that the Module name will link to.
- `menu`: JetpackFooterMenuItem[] - (default: `undefined`) set the menu items to be rendered in the footer.
- `onAboutClick`: () => void - (default: `undefined`) function called when the About link is clicked.
- `onPrivacyClick`: () => void - (default: `undefined`) function called when the Privacy link is clicked.
- `onTermsClick`: () => void - (default: `undefined`) function called when the Terms link is clicked.
