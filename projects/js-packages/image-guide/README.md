# image-guide

Go through the dom to analyze image size on screen vs actual file size.

## How to install image-guide

### Installation From Git Repo

## UI setup

`setupImageGuideUI( target, { href, tracksCallback, fetchFunction } )` mounts the
React toolbar in a new wrapper inside `target`, preserving its existing children.
Call it before the window `load` event; tracking is registered synchronously.
It returns `{ unmount() }`, which removes the toolbar and its wrapper and can be
called repeatedly. Page guides and their listeners live until the page unloads;
this handle only controls the toolbar. Boost ignores the return value.

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

image-guide is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

