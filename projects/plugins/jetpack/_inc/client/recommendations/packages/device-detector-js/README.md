# Summary

The vast majority of this code came from an npm package called [device-detector-js](https://www.npmjs.com/package/device-detector-js) and the usage is the same as in those docs. Here is the main snippet on that page on how to use this package.

```javascript
import DeviceDetector from "device-detector-js";

const deviceDetector = new DeviceDetector();
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36";
const device = deviceDetector.parse(userAgent);

console.log(device);
```

The open source license for this package can be found [here](https://github.com/etienne-martin/device-detector-js/blob/master/LICENSE)

Much was stripped from this package as we didn't need a lot of the info. For example, at the time of this writing, there was no need to detect televisions, media players, or feed readers. As such, they were removed from this form of the package.
