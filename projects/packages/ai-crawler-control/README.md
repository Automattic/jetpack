# AI Crawler Control

Indicate to AI crawlers that they should not index your site’s content.

This package does so in 2 different ways:

1. It adds lines to the site's `robots.txt` to encourage AI user agents to not crawl the site.
2. It creates a `/ai.txt` file, as proposed by [Spawning.ai](https://spawning.ai/ai-txt). It marks a full list of file extensions as not indexable by AI agents.

## How to install AI Crawler Control

The package can be required in your WordPress plugin or theme via Composer:

```bash
composer require automattic/ai-crawler-control
```

In addition to this package, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

Then, within your WordPress project (plugin or theme), you can initialize the package by calling the `init` method:

```php
\Automattic\Jetpack\Ai_Crawler_Control::init();
```

### Installation From Git Repo

## Contribute

You can contribute to the development of this package by visiting the [GitHub repository](https://github.com/automattic/jetpack/).

## Get Help

You can ask questions about the package on the [GitHub repository](https://github.com/automattic/jetpack/). If you've installed the Jetpack plugin and have trouble with this feature, you can get help on the [Jetpack support page](https://jetpack.com/support/).

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

ai-crawler-control is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

