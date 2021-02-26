# Jetpack Termination Dialog

This dialog is used to confirm with the user if they want to disconnect from Jetpack.

## Versions of the dialog

- Modal - A Modal to pop anywhere in the dashboard/React App. At 'components/jetpack-termination-dialog/modal';

## How to use:

Roughly adapated form `components/connect-button/index.jsx`

```jsx
import JetpackDisconnectModal from 'components/jetpack-termination-dialog/disconnect-modal';

<Button onClick={ this.setState( { showModal: ! this.state.showModal } ) } />

<JetpackDisconnectDialogModal
	show={ this.state.showModal }
	showSurvey
	toggleModal={ this.toggleVisibility }
/>
```
