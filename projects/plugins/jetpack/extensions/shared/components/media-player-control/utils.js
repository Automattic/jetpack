/* global mejs */

// MediaElement.js loads on-demand in the editor, so look the helpers up at call
// time rather than at module-evaluation time. Reading them at import would throw
// ReferenceError if the importing module evaluates before mediaelement is on the
// page, which can happen for blocks that don't otherwise depend on `wp-mediaelement`.
export const convertSecondsToTimeCode = seconds => mejs.Utils.secondsToTimeCode( seconds );
export const convertTimeCodeToSeconds = timecode => mejs.Utils.timeCodeToSeconds( timecode );
