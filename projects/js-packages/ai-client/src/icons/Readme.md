# Icons

This library provides you with a selection of icons to use in your Gutenberg applications.

- aiAssistantIcon
- origamiPlane
- speakTone

```jsx
import { Icon } from '@wordpress/components';
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';

function YourComponent() {
  // ...
  return (
    <div>
      // Your code here...
      <Icon icon={ aiAssistantIcon } />
    </div>
  );
}
```