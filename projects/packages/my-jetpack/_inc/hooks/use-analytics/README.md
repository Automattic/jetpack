# useAnalytics

React hook that provides access to the functions exported by @automattic/jetpack-analytics by almost autoinitializing it. 
Depends on the connection package @automattic/jetpack-connection


```es6
import useAnalytics from './hooks/use-analyticis';

function PlansSection() {
	const analytics = useAnalytics();
	const doit = () => {
		analytics.tracks.recordEvent( 'jetpack_doit_click' );
		alert( 'do something' );
	}
	return (
		<div>
			<Button onClick={ doit }>Do it!</Button>
		</div>
	)
}
```
