## Jetpack Icons

Exports:

### getIconBySlug( slug )

Available slugs are:

* jetpack-ai
* anti-spam
* backup
* boost
* crm
* extras
* protect
* scan
* search
* social
* star
* videopress
* jetpack
* share

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
* JetpackIcon
* ShareIcon

```es6
import {
	JetpackAiIcon,
	AntiSpamIcon,
	BackupIcon,
	BoostIcon,
	CheckmarkIcon,
	CrmIcon,
	ExtrasIcon,
	ProtectIcon,
	ScanIcon,
	SearchIcon,
	SocialIcon,
	StarIcon,
	VideoPressIcon,
	StatsIcon,
	ClipboardIcon,
	JetpackIcon,
	ShareIcon,
} from '@automattic/jetpack-components';

return (
	<div>
		<JetpackAiIcon />
		<AntiSpamIcon />
		<BackupIcon />
		<BoostIcon />
		<CheckmarkIcon />
		<CrmIcon />
		<ExtrasIcon />
		<ProtectIcon />
		<ScanIcon />
		<SearchIcon />
		<SocialIcon />
		<StarIcon />
		<VideoPressIcon />
		<StatsIcon />
		<ClipboardIcon />
		<JetpackIcon />
		<ShareIcon />
	</div>
)
```
