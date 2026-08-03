## Jetpack 16.1

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Podcast is now available on self-hosted sites ([#50447](https://github.com/Automattic/jetpack/pull/50447))

The Podcast module auto-activates on new installations, so folks may have questions about it. It's worth testing again even though it has already been tested for WordPress.com.

- Go to Jetpack > My Jetpack and confirm the Podcast card appears under the growth products.
- Confirm the Podcast module is now listed in the available modules and can be activated/deactivated.
- Go to Jetpack > Podcast and try the flows from there:
  - Enable podcasting
  - Purchase a plan
  - Create a new category for podcasting
  - Add details (description, cover image, …) to your podcast
  - Create a podcast episode

### Blaze Ads menu move and rename ([#49584](https://github.com/Automattic/jetpack/pull/49584))

The Blaze menu was renamed from "Advertising" to "Blaze Ads" and moved out of Tools. Where it lands depends on the site, so this needs a few different environments.

Note: For displaying Blaze Ads your site needs to be launched

**Jetpack site (no WooCommerce)**

- Go to wp-admin and confirm the menu appears as Jetpack → Blaze Ads. Click it and confirm the Blaze dashboard loads.
- Go to Tools and confirm there's still a temporary "Advertising" entry showing a "moved" notice when you click it, with a button that takes you to the new location.

**WooCommerce + Jetpack**

- On a site with WooCommerce active, confirm the menu appears as Marketing → Blaze Ads instead.

**WordPress.com Simple site**

- Confirm Jetpack → Blaze Ads appears and opens the dashboard.

**Old URL**

- Visit `tools.php?page=advertising` and confirm it redirects to `admin.php?page=advertising`.

### AI image and media tools no longer load for unconnected admins ([#50079](https://github.com/Automattic/jetpack/pull/50079))

The editor's AI image and media generation tools load from a single asset. Until now that asset was enqueued whenever the site offered the tools, so it also loaded for administrators who hadn't connected their own WordPress.com account — users who can't actually use the tools and would only hit errors.

_Requires: a site connected to WordPress.com by one user (the connection owner) plus a second administrator who has not connected their own WordPress.com account. This applies to self-hosted Jetpack, VIP, and Atomic (where a second user can disconnect their account)._

- As the connection owner, open the post editor and the Media Library — the AI image and media tools should appear and work as before.
- As the non-connected administrator, open the post editor and the Media Library:
  - Before this change: the tools appear but error when used.
  - After this change: the tools no longer appear, and the asset is not enqueued on the page.
- Reconnect that administrator's WordPress.com account, reload, and confirm the tools return.
- On WordPress.com Simple, confirm no change — all admins keep the tools, since Simple has no per-user connection.

### Account Protection screen wording ([#50338](https://github.com/Automattic/jetpack/pull/50338))

There shouldn't be much to test here (mostly wording changes to an existing feature), but here they are:

- Add an admin user to your Jetpack test site with a bad username and password combo. `admin` / `password` works well.
- Try logging in and seeing that an improved Account Protection screen shows with more detailed info about what is happening.

No backend changes to the feature were made, it's purely a wording thing.

### Monetize block inserter icons ([#50528](https://github.com/Automattic/jetpack/pull/50528))

Going to the editor and checking that the Monetize icons have more normalized positions, sizes, and weights should be enough.

### Likes are hidden on password-protected posts ([#50670](https://github.com/Automattic/jetpack/pull/50670))

- On a site with Likes enabled (Jetpack → Settings → Sharing), publish a normal post and confirm the Like button still appears on the front end.
- Publish a second post and set a password on it. View it logged out — there should be no Like button, before or after entering the password to unlock it.
- View that same password-protected post as an admin or as its author. The Like button should stay hidden for them too.
- Repeat step 2 with a post that uses the Like block instead of the automatic button — same result.

### Carousel: gallery rendering and accessibility fixes ([#50760](https://github.com/Automattic/jetpack/pull/50760), [#50415](https://github.com/Automattic/jetpack/pull/50415), [#50220](https://github.com/Automattic/jetpack/pull/50220), [#50201](https://github.com/Automattic/jetpack/pull/50201), [#50199](https://github.com/Automattic/jetpack/pull/50199), [#50181](https://github.com/Automattic/jetpack/pull/50181), [#50827](https://github.com/Automattic/jetpack/pull/50827))

**Requires:** **Carousel must be turned on** (Jetpack → Settings → Writing) - it is off on a fresh site and every step needs it. For step 5, **Settings → Media → "Show photo metadata (Exif)"** must be checked, plus one photo with EXIF and one without. Use large photo originals (~2000px), or steps 1-2 never trigger. DevTools device mode or a phone, and an OS "reduce motion" setting. Steps 6-7 need the Bleeding Edge build.

- Publish a **core Gallery block** with 15-20 large photos. Throttle the network to Slow 4G and step through every slide with the right arrow. Each slide shows a blurred low-res thumbnail that sharpens into the full image - no slide is ever black.
- In a portrait mobile viewport, run `document.querySelectorAll('[data-large-file]').forEach(i=>i.removeAttribute('data-large-file'));` in the console, then tap a photo wider than about 800px (aspect ratio does not matter). The full-size original loads and fills the slide - `document.querySelector('.swiper-slide-active img').src` is the real image URL, not empty.
- Add an Image block set to **Link to → Attachment page**. Click it - the carousel opens. Close it, Tab until the **link** has focus, press Enter - it opens again without navigating to the attachment page. Repeat with an Image block using a **Custom URL**: that one must navigate away and must **not** open the carousel.
- With the carousel closed, run `document.querySelectorAll('.jp-carousel-overlay h1, .jp-carousel-overlay h2, .jp-carousel-overlay h3').length` - it must be `0`, since the caption, title and description are now `<div>`s. Also confirm `a.jp-carousel-image-download` has `aria-label="Download image"`, and that `document.querySelectorAll('.jp-carousel-image-exif').length` is `0`.
- Open the photo with EXIF, click the **i** icon and **scroll down inside the overlay** - the panel renders below the fold. A `<ul class="jp-carousel-image-exif">` now exists between the caption and the download link. Move to the photo without EXIF and it is gone. No console errors.
- Open and close the carousel a few times. The fade is short, the controls are clickable, and the overlay is fully gone afterwards.
- Turn on reduce motion and repeat - the overlay appears and disappears instantly. Switch browser tabs mid-open and come back; it must not stick.

### Newsletter: modernized dashboard on by default ([#50091](https://github.com/Automattic/jetpack/pull/50091), [#50767](https://github.com/Automattic/jetpack/pull/50767))

**Requires:** The **Subscriptions** module must be active - the modernized Newsletter page hides itself entirely without it. For steps 5-6, a site connected to WordPress.com at the site level, edited by an admin who has not connected their own WordPress.com account. The prompt is skipped on Simple sites.

- Go to **Jetpack → Newsletter**. The modernized dashboard loads with **Subscribers** and **Settings** tabs, landing on Subscribers - not the old settings-only screen. Open the subscriber list and confirm it renders.
- Check **Jetpack → Subscribers**. The external-link arrow is gone and it no longer goes to wordpress.com - it opens an in-admin **Subscribers moved** page. **View my subscribers** lands on Jetpack → Newsletter.
- Turn on **Remove Subscribers from the sidebar**. The item disappears; **reload** and confirm it is still gone, then visit `wp-admin/admin.php?page=jetpack-subscribers` directly - it still loads. Turn it back off.
- Optional: add `add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );` and confirm Newsletter reverts to the legacy settings screen. Follow its **Manage all subscribers** link and **report where it lands** - it currently points at an unregistered page. Remove the filter afterwards.
- As a **second administrator who has never connected their own WordPress.com account** (on a default site the first admin owns the connection, so create one), open a post, click **Publish**, and in the pre-publish panel open **Newsletter → Send test email**. The connect notice is already showing when the modal opens, and **Send** is disabled. Do **not** use the Send test email button in the Jetpack sidebar - it is hidden for unconnected users and tests something else.
- Same user, on a saved draft: open the **View / Preview** dropdown and choose **Email preview**. You get **Connect your account to preview this email**, not the generic "something went wrong" panel. Then connect the account, reopen both, and confirm the prompt is gone, **Send** is enabled and the preview renders.

### Forms: duplicated fields no longer collapse into one another ([#50247](https://github.com/Automattic/jetpack/pull/50247))

**Requires:** A notification email address you can read.

- Add a **Form** block, pick the **Contact Form** template, and delete the **Email** and **Multi-line text field** it pre-fills. Duplicate **Name** twice and **Last name** once - select the field block itself via **List View** or the breadcrumb bar, since clicking the field on the canvas selects its label, which has no **Duplicate**. Give all five distinct labels, set **Send email notifications to** under **Form notifications**, then **Save** and **Publish**.
- Confirm the duplicates still share ids (`name`, `last-name`) rather than having been renamed - otherwise the rest of this section proves nothing.
- **On the published post, not the editor**, type a different value into each of the five fields. Typing in one must not mirror into any other.
- Submit the form, then open **Jetpack → Forms** and click into the response. All five fields appear as separate entries with the five distinct values.
- The notification email shows the same five values.

**Thank you for all your help!**
