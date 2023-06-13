# Modal

The `<Modal>` is a connected component that renders a pop-up modal based on `modal` redux state.

## Usage

## Placing the global modal component

Insert `<Modal>` somewhere in your application:

```jsx
import Modal from './components/modal';

const MyComponent = () => (
    <Modal />
);
```

## Opening a modal

Trigger modals by dispatching a `setModal()` action with the modal type to open:

```jsx
import { useDispatch } from '@wordpress/data';
import { STORE_ID } from './state/store';

const MyComponent = () => {
    const { setModal } = useDispatch( STORE_ID );

    const handleShowModalClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'CREDENTIALS_NEEDED',
			} );
		};
	};

    return (
        <button onClick={ handleShowModalClick }>
            Show Modal
        </button>
    )
};
```