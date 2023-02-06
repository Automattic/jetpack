# Reconnect Modal

This modal is used to confirm with the user if they want to reconnect Jetpack.


## How to use:

```jsx
import ReconnectModal from 'components/reconnect-modal';

<Button onClick={ this.setState( { showModal: true } ) } />

<ReconnectModal
	show={ this.state.showModal }
	onHide={ this.setState( { showModal: false } ) }
/>
```
