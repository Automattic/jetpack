# Summary

This component adds a Zendesk chat widget via <script> tag to any page the componet is added to 

WARNING: If you add this to a specific site, it will stay on the page until the browser reloads onto a page that does not load this widget. For example, if a section of the plugin is using `react-router-dom`, and the widget is loaded onto one specific route, it will not go away when a new route is taken since the page is not reloaded

## Usage

```tsx
import React from 'react';
import { ZendeskChat } from '@automattic/jetpack-components';

const ExampleComponent = () => (
	<ZendeskChat />
);
```

## Props

None

Because the chat is conditionally rendered based on Date and Time, no props are needed in order to render correctly.
  
## Note

There is a wpcom/v2 API endpoint `/presales/chat?group=jp_presales` that returns whether or not chat is available at this time. This should be used when determining whether or not to render this component.