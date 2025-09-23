# MediaEditor Component

The MediaEditor component provides an interface for editing media attachments.

## Usage

### Basic Usage

```tsx
function MyMediaEditor() {
	return <MediaEditor postId="123" />;
}
```

## Props

| Prop        | Type              | Default        | Description                                                  |
| ----------- | ----------------- | -------------- | ------------------------------------------------------------ |
| `postId`    | `string`          | **Required**   | The ID of the media attachment to edit                       |
| `postType`  | `string`          | `'attachment'` | The post type of the media item                              |
| `isPreview` | `boolean`         | `false`        | Whether to render in preview mode (hides header and sidebar) |
| `children`  | `React.ReactNode` | `undefined`    | Optional children to render below the editor                 |
