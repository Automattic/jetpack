# Jetpack Just In Time Messages

A package encapsulating Just In Time Messages.

Just In Time Messages (JITMs) are real-time contextual in-admin notices. Such notices are displayed on specific admin pages, based on multiple parameters (page visited, Jetpack connection status, plan status, features active, ...).

There are 2 main ways to use JITMs:

- You can create static notices within the Jetpack plugin. Those will be displayed before the site is connected to WordPress.com. See `Pre_Connection_JITM` to find out more.
- You can create dynamic notices once the Jetpack plugin is connected to WordPress.com. Those notices will be pulled from WordPress.com depending on the parameters mentioned above. See `Post_Connection_JITM` to find out more.

### Usage

Instantiating the JITM Manager will facilitate the display of JITM messages in wp-admin
