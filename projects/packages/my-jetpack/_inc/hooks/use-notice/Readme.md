# useNotice custom hooks 

## useNoticeWatcher

## useGlobalNotice

```es6
import { useGlobalNotice } from './hooks/use-notice';

function PlansSection() {
	const global = useGlobalNotice();
	if ( ! global ) {
		return null;
	}

	return (
		<Notice>{ global.message }</Notice>;
	)
}
```
