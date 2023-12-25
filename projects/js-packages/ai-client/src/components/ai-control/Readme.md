### AIControl

#### Properties

- `disabled` (**boolean**) (Optional): Disables the ai control. Default value is `false`.
- `value` (**string**): Current input value. Default value is `''`.
- `placeholder` (**string**) (Optional): Placeholder text for the input field. Default value is `''`.
- `showAccept` (**boolean**) (Optional): Determines if the accept button is shown. Default value is `false`.
- `acceptLabel` (**string**) (Optional): Label text for the accept button. Default value is `'Accept'`.
- `showButtonLabels` (**boolean**) (Optional): Determines if button labels are shown. Default value is `true`.
- `isTransparent` (**boolean**) (Optional): Controls the opacity of the component. Default value is `false`.
- `state` (**RequestingStateProp**) (Optional): Determines the state of the component. Default value is `'init'`.
- `showClearButton` (**boolean**) (Optional): Determines if the clear button is shown when the input has a value. Default value is `true`.
- `showGuideLine`: (**boolean**) (Optional): Whether to show the usual AI guidelines at the bottom of the input.
- `customFooter`: (**ReactElement**) (Optional): if provided together with `showGuideLine` it will be rendered at the bottom of the input.
- `onChange` (**Function**) (Optional): Handler for input change. Default action is no operation.
- `onSend` (**Function**) (Optional): Handler to send a request. Default action is no operation.
- `onStop` (**Function**) (Optional): Handler to stop a request. Default action is no operation.
- `onAccept` (**Function**) (Optional): Handler to accept the input. Default action is no operation.

#### Example Usage

```jsx
import { AIControl, FooterMessage } from '@automattic/jetpack-ai-client';

<AIControl
  value="Type here"
  placeholder="Placeholder text"
  onChange={ handleChange }
  onSend={ handleSend }
  onStop={ handleStop }
  onAccept={ handleAccept }
  showGuideLine={ true }
  customFooter={ <FooterMessage severity="info">Remember AI suggestions can be inaccurate</FooterMessage> }
/>
```
