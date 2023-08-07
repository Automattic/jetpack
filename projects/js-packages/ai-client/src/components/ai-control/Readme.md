### AIControl

#### Properties

- `loading` (**boolean**) (Optional): Determines the loading state. Default value is `false`.
- `disabled` (**boolean**) (Optional): Disables the ai control. Default value is `false`.
- `value` (**string**): Current input value. Default value is `''`.
- `placeholder` (**string**) (Optional): Placeholder text for the input field. Default value is `''`.
- `showAccept` (**boolean**) (Optional): Determines if the accept button is shown. Default value is `false`.
- `acceptLabel` (**string**) (Optional): Label text for the accept button. Default value is `'Accept'`.
- `showButtonsLabel` (**boolean**) (Optional): Determines if button labels are shown. Default value is `true`.
- `isOpaque` (**boolean**) (Optional): Controls the opacity of the component. Default value is `false`.
- `requestingState` (**RequestingStateProp**) (Optional): Determines the state of the request. Default value is `'init'`.
- `onChange` (**Function**) (Optional): Handler for input change. Default action is no operation.
- `onSend` (**Function**) (Optional): Handler to send a request. Default action is no operation.
- `onStop` (**Function**) (Optional): Handler to stop a request. Default action is no operation.
- `onAccept` (**Function**) (Optional): Handler to accept the input. Default action is no operation.

#### Example Usage

```jsx
<AIControl
  value="Type here"
  placeholder="Placeholder text"
  onChange={ handleChange }
  onSend={ handleSend }
  onStop={ handleStop }
  onAccept={ handleAccept }
/>
```