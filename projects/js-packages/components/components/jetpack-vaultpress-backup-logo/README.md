JetpackVaultPressBackupLogo
========

Component that renders the Jetpack VaultPress Backup SVG logo.
It consists of the Jetpack symbol followed by the name.
It takes width and height properties but defaults to 32px in height.

#### How to use:

```js
<JetpackVaultPressBackupLogo height={ 48 } className="jp-logo" />
```

#### Props

* `className`: String - (default: `jetpack-vaultpress-backup-logo`) the class name set on the SVG element.
* `height`: Number - (default: 32) set the height of the logo.
* `width`: Number - (optional) set the width of the logo.
* `showText`: Boolean - (default: true) Whether to show text `VaultPress Backup` after the logo.
