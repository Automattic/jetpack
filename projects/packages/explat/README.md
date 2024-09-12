# explat

A package for running A/B tests on the Experimentation Platform (ExPlat) in the plugin.

## How to install Jetpack ExPlat

Run `composer require automattic/jetpack-explat` and `pnpm install -S "@automattic/jetpack-explat"` in the root folder of your project.

## Using this package in your WordPress plugin

In the PHP method that initializes your project, call the following static method to initialize the ExPlat API and register its endpoints:

```php
use Automattic\Jetpack\ExPlat;

ExPlat::init();
```

In your React code, import the `Experiment` component and start running experiments:

```js
import { Experiment } from '@automattic/jetpack-explat';

const DefaultExperience = <div>__( 'Control title' )</div>;
const TreatmentExperience = <div>__( 'Treatment title' )</div>;
const LoadingExperience = <div>⏰</div>;

<Experiment
	name="jetpack_example_experiment"
	defaultExperience={ DefaultExperience }
	treatmentExperience={ TreatmentExperience }
	loadingExperience={ LoadingExperience }
/>;
```

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack ExPlat is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

