# Modal

The `<Modal>` is a connected component that renders a pop-up modal based on `modal` context state.

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

Trigger modals by using the `setModal()` function:

```jsx
const MyComponent = () => {
    const { setModal } = useModal();

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