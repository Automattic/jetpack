## Jetpack Product Icons

Exports:

### getIconBySlug( slug )

Available slugs are:

* anti-spam
* backup
* boost
* crm
* extras
* scan
* search
* star
* videopress

```es6
import {
	getIconByslug
} from '@automattic/jetpack-components';

const Icon = getIconBySlug( 'boost' );
return (
	<div>
		<Icon />
	</div>
)
```

#### Icons

* AntiSpamIcon
* BackupIcon
* BoostIcon
* CheckmarkIcon
* CrmIcon
* ScanIcon
* SearchIcon
* StarIcon
* VideopressIcon

```es6
import {
	AntiSpamIcon,
	BackupIcon,
	BoostIcon,
	CheckmarkIcon,
	CrmIcon,
	ScanIcon,
	SearchIcon,
	StarIcon,
	VideoPressIcon
} from '@automattic/jetpack-components';

return (
	<div>
		<AntiSpamIcon />
		<BackupIcon />
		<BoostIcon />
		<CheckmarkIcon />
		<CrmIcon />
		<ScanIcon />
		<SearchIcon />
		<StarIcon />
		<VideoPressIcon />
	</div>
)
```
