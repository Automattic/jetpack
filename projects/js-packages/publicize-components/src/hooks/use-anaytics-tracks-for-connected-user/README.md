# useAnalyticsTracksForConnectedUser hook
This hook is used to facilitate recording of tracks analytics events, 
limiting recording of events to when a user has a Jetpack connection.

The hook function also accepts parameters to record a "page view" event when the component renders.
```es6

const Component = () => {
	const { recordEvent } = useAnalyticsTracks( {
			pageViewEventName: 'view_event_name',
			pageViewNamespace: 'jetpack',
			pageViewSuffix: '',
		} );
	const recordReviewClick = useCallback( () => { recordEvent( 'event_name', {} ) }, [] );
	
	return (
		<Button
			onClick={ recordReviewClick }
		>
			{ __( 'Leave a Review', 'jetpack' ) }
		</Button>
	)
}
```
