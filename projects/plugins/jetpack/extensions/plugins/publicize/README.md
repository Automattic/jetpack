# Publicize plugin

## Data approach

### The Store

The data approach is based on the post meta data in the sense it stores relevant that there. However, it also implements a sub-store named jetpack/publicize that acts mostly as a connection layer.
For instance, to get all connections for the given post you'd like to use the `getConnections()` selector, but in the end, the selector will pick the data from the post meta.

Probably this implementation could be changed with a different approach, for instance, extending straightforward the core store in order to deal with the publicize data from there, getting rid of this new jetpack/publicize store.

### Hooks

Although it's completely possible to pick data and dispatch actions from the store, we encourage using [the hooks](./hooks/) when it's doable.
