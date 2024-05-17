# Creating a Great Bug Report

[The Issues tab](https://github.com/Automattic/jetpack/issues) is a ticket database used to track projects and bugs -- we use it to manage new features, bug reports, and general project tasks. It's designed to make it as simple as possible for people to report bugs and submit patches to the code.

## Three Steps to Being a GitHub Star

### 1. Make sure the bug is really a bug

Before you report a bug, make sure it's not just internet gremlins or a compatibility problem. Before you begin your investigation, make sure you're running the latest versions of WordPress and Jetpack.

Start by turning off all your other plugins and switching to the default Twenty Seventeen theme. Do you still see the issue? If so, you might have found a bug.

If the issue disappears, it was probably caused by a conflict with one of your plugins or themes. Now, test them one at a time -- activate only Jetpack and that theme or plugin to eliminate other variables. When the issue reappears, you've found the culprit!

### 2. See if it's already been reported

To check if a bug has already been reported, you can:

- Check out the [Known Issues](http://jetpack.me/support/getting-started-with-jetpack/known-issues/) page.
- Look through the [current list of Opened Issues](https://github.com/Automattic/jetpack/issues?state=open).
- Browse the [Jetpack Support Forums](http://wordpress.org/support/plugin/jetpack).

Not mentioned in any of those places? Not caused by a conflict with another plugin or theme? By George, you've found a bug! Time to report it.

### 3. Submit a detailed, precise bug report

The more specific your ticket is, the easier it will be for someone to zap the bug. Log in to GitHub, [open a new issue](https://github.com/Automattic/jetpack/issues/new?assignees=&labels=%5BType%5D+Bug&template=bug-report.yml), and be sure to fill out all the relevant details: a concise summary and a clear description are key. If it's been mentioned by someone else, like on the [Jetpack Support Forums](http://wordpress.org/support/plugin/jetpack), include a link.

Here's a sample of what a helpful summary looks like:

> Summary of the issue: *The Jetpack Image widget won't display the selected image.*
>
> Steps to reproduce:
>
> *1. Activate the Extra Sidebar Widgets module.*
> *2. Include the Jetpack Image widget in the sidebar, and fill out all the fields, including the image URL.*
> *3. Save the Widget and view your site.*
>
> Expected behavior or result: *The sidebar should display the selected image*
>
> Actual behavior or result: *An error appears: "Image could not be found."*
>
> Link to Example (if applicable): *http://example.com/image-widget/*
>
> Screenshots: _screenshot of error message goes here_

## Cross-Browser Testing

If you believe you've come across a bug and you've worked through all the steps detailed above, it's worth checking to see if the issue can be reproduced in different browsers. You can find download links to the most recent versions of all the major browsers on [Browse Happy.](http://browsehappy.com/)

You should also check to see if the potential bug is limited to one browser; this is especially important for any bugs that may be Javascript or jQuery-related, as some browsers are more likely to experience those issues than others.

See which browsers Jetpack supports from [coding guidelines](../coding-guidelines.md#versions-supported) or from [the `@wordpress/browserslist-config` package](https://www.npmjs.com/package/@wordpress/browserslist-config).

## Contribute and comment on existing issues

In addition to reporting bugs and submitting patches, you can also follow the progress of any issue you're interested in or add details to an existing issue.

To follow an issue, log in to GitHub, find the issue you're interested in, scroll to the bottom, and click on **Subscribe**:

![subscribe-issue](https://cloud.githubusercontent.com/assets/426388/21441470/74593e46-c898-11e6-8659-137f39d72af3.png)

If you have information to add to an existing ticket, feel free to add a comment to it!
