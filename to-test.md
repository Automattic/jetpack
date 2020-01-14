## 8.1

### Site Accelerator

The devicepx library has been disabled by default, unless explicitly enabled via theme support. This library was previously used to compensate for lack of browser support. To quote Joseph Scott:

```
As a general item, I'd be happy to see devicepx go away entirely. My only concern is for places that assume it will be around and could potentially end up with unexpected results.

Devicepx came about because there were not great ways for managing alternate image needs, like DPI ( retina ). Now, we have much better options that don't require JavaScript to be checking things all the time. We certainly have the browser feature support that makes it possible for devicepx to go away.
```

To test enable the Jetpack plugin. Make sure it no longer enqueues the `https://s0.wp.com/wp-content/js/devicepx-jetpack.js` script on all pages automatically. Please make sure images of various sizes (galleries, featured images, icons, etc.) look fine on different screens.

Add `add_theme_support( 'jetpack-devicepx' );` to theme's functions.php and notice that now all front-end page loads include the https://s0.wp.com/wp-content/js/devicepx-jetpack.js script. You can use the following snippet:

```
add_action( 'init', 'jetpack_declare_theme_support' );
function jetpack_declare_theme_support() {
	add_theme_support( 'jetpack-devicepx' );
}
```

Load an AMP page and notice that the devicepx library is not loaded as expected.

### Subscriptions

The option to send emails on new subscribers has been added to wp-admin. Previously the option could only be set using Calypso. To test you can go to the wp-admin settings and open the Discussion tab. The new checkbox will be in the "Email me whenever" section. Make sure you can save both the on and off value, and change it using Calypso.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
