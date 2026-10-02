/**
 * Higher-order component creator which, given an object of DOM event types and
 * values corresponding to a callback function name on the component, will
 * create or update a window event handler to invoke the callback when an event
 * occurs. On behalf of the consuming developer, the higher-order component
 * manages unbinding when the component unmounts, and binding at most a single
 * event handler for the entire application.
 *
 * @deprecated
 *
 * @param {Record<keyof GlobalEventHandlersEventMap, string>} eventTypesToHandlers Object with keys of DOM
 *                                                                                 event type, the value a
 *                                                                                 name of the function on
 *                                                                                 the original component's
 *                                                                                 instance which handles
 *                                                                                 the event.
 *
 * @return {any} Higher-order component.
 */
export default function withGlobalEvents(eventTypesToHandlers: Record<keyof GlobalEventHandlersEventMap, string>): any;
//# sourceMappingURL=index.d.ts.map