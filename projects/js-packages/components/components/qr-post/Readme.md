# <QRPost>

React component intended to be used in the Block Editor context.
The component relevant data from the data store to render a QR code that leads to the Site post.

### Example
The following code adds a QR Code for the post once it publishes.

```es6
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { QRPost } from '@automattic/jetpack-components';
 
const PluginPostPublishQRCodePanel = () => (
    <PluginPostPublishPanel title="QR post code">
		<QRPost />
    </PluginPostPublishPanel>
);
 
registerPlugin( 'post-publish-qr-code-panel', {
    render: PluginPostPublishQRCodePanel,
} );
```