# ExPlat

Jetpack RNA component and utils for A/B testing.

## How to install ExPlat

### Installation From Git Repo

This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using core-js or @babel/polyfill will add support for these methods. Learn more about it in Babel docs.

## Usage

```js
import { Experiment } from '@automattic/jetpack-explat';

const DefaultExperience = <div>Hello World!</div>;

const TreatmentExperience = <div>Hello Jetpack!</div>;

const LoadingExperience = <div>⏰</div>;

<Experiment
	name="jetpack_example_experiment"
	defaultExperience={ DefaultExperience }
	treatmentExperience={ TreatmentExperience }
	loadingExperience={ LoadingExperience }
/>;
```

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

ExPlat is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

