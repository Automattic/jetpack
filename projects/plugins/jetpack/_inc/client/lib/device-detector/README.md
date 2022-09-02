# Summary

This is a small library function to detect if a device is a mobile device, and return null if no mobile device is detected.

This will not cover all mobile devices, but it should cover the vast majority of phones that use the iOS App Store and the Google Play store. At this time, this function is being used to conditionally show a QR Code for desktop, an App Store link if iOS, and a Google Play store link if android. Because of this, other types of phones with different app stores do not need to be detected and can be identified as "unknown"

Usage of this function is dirt simple. Just import and use as described below

```javascript
import detectMobileDevice from 'lib/device-detector';

let device = detectMobileDevice();

console.log( device );
```

For the current use case, this could have been done in a way that returns 'desktop' by default as any `unknown` values will be treated as such. I left it as `unknown` because it seems more accurate in what the function actually does and makes the meaning more flexible to other programmers in the future.
