# Publicize Components

A library of JS components required by the Publicize editor plugin

## Data approach

### The Store

The Publicize module stores the connection data in the post meta. That way the data is specific to a post, which allows us to check if the post can be shared. There's also a `jetpack/publicize` sub-store that adds additional connection data from other data sources, such as WPCOM. We save that additional data to the post meta, and access it from the post meta as the single source of truth.
For instance, to get all connections for the given post you'd like to use the `getConnections()` selector, but in the end, the selector will pick the data from the post meta.

Probably this implementation could be changed with a different approach, for instance, extending straightforward the core store in order to deal with the publicize data from there, getting rid of this new jetpack/publicize store.

### Hooks

Although it's completely possible to pick data and dispatch actions from the store, we encourage using [the hooks](./src/hooks/) when it's doable.

## How to install Publicize Components

### Installation From Git Repo

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

publicize is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

