/* global JP_CONNECTION_INITIAL_STATE */

export const wpcomTrackEvent = (
	eventName,
	eventProperties = {},
	eventUserId = null,
	eventUsername = null
) => {
	const currentUser = JP_CONNECTION_INITIAL_STATE?.userConnectionData?.currentUser ?? {};

	const userId = eventUserId ?? currentUser.id;
	const username = eventUsername ?? currentUser.username;
	const blogId = eventProperties.blogId ?? currentUser.blogId;

	window._tkq = window._tkq || [];
	if ( username && userId ) {
		window._tkq.push( [ 'identifyUser', userId, username ] );
	}
	window._tkq.push( [
		'recordEvent',
		eventName,
		{
			...eventProperties,
			blog_id: blogId,
		},
	] );
};
