# useAnalyticsTracks hook
This hook is used to add some functionality around tracks analytics
Handles initializing the user and allows for easy setup of callbacks
This implementation only records events when the current user has a Jetpack connection

```es6

const Component = () => {
	const { recordEventHandler, recordEvent } = useAnalyticsTracks( {
			pageViewEventName: 'view_event_name',
			pageViewNamespace: 'jetpack',
			pageViewSuffix: '',
		} );
	const recordReviewClick = recordEventHandler( 'event_name', {} );
	
	return (
		<Button
			onClick={ recordReviewClick }
		>
			{ __( 'Leave a Review', 'jetpack' ) }
		</Button>
	)
}
```
