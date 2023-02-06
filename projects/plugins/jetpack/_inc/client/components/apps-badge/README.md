# AppsBadge

This component renders a badge that links to an app store (iOS or Android).

## Props:

- *altText* - the `alt` text for the app store `img`.
- *storeLink* - link to the app store.
- *storeName* - which app store we are displaying, either 'ios' or 'android'.
- *titleText* - the `title` text for the app store `a`.
- *onBadgeClick* - a function that will be called when the badge is clicked
- *utm_source* - UTM source parameter passed to the default store link
- *utm_campaign* - UTM campaign parameter passed to the default store link
- *utm_medium* - UTM medium parameter passed to the default store link

If `storeLink` is not provided, this component will use the store link for the WordPress app

## Usage:

```js
import Banner from 'components/apps-badge';

render() {
	return (
		<AppsBadge
			altText="Download the Jetpack iOS mobile app."
			titleText="Download the Jetpack iOS mobile app."
			storeName="ios"
			storeLink="https://link.to.the.app.store/"
		/>
	);
}
```
