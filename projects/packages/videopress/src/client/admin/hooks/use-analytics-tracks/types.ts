type eventPrefix = 'jetpack_videopress';
type eventSuffix = 'page_view';
type eventName = string;
type eventPageViewNameProp = `${ eventPrefix }_${ eventName }_${ eventSuffix }`;

export type useAnalyticsTracksProps = {
	pageViewEventName?: eventPageViewNameProp;
	pageViewEventProperties?: {
		[ key: string ]: string | number | boolean;
	};
};
