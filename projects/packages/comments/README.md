# Jetpack Comments

Replaces the default WordPress comment form with social login, subscription options, and block editing. This is the successor to Highlander Comments, and the new home for the feature WordPress.com currently ships as **Verbum**.

Scaffolding only. `src/` is empty and nothing loads this package. WordPress.com still runs the copy in `jetpack-mu-wpcom` (`src/features/verbum-comments/`). The code moves here in reviewable chunks, and this README gets written properly once there's something to describe.

`composer.json` declares no `autoload` block on purpose. The mirror repo drops `.gitkeep`, so a classmap pointing at an empty `src/` fails `composer install`. Add it back with the first class.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Comments is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
