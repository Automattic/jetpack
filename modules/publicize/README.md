Jetpack - Publicize Module
==============
[See Publicize Description](https://jetpack.com/support/publicize/)

## How Publicize Works
 1. Client submits request to publish post
 2. Publicize catches incoming post and sets post meta to configure sharing options
 3. Post is published
 4. WP.com receives publishing post and shares to connected social media accounts based on post meta


### Meta Keys
#### Skipping connections

By default, if a post is published when Publicize is enabled, WP.com shares it to the current user's connected social media accounts.

If a post should not be shared to a connection, the appropriate post meta must be set by Publicize.

The meta key prefix to skip a connection is `_wpas_skip_`. WP.com will skip sharing a post to a connection if this meta key is set for a given connection id.

For example, for a connection ID `'123'` Publicize would flag it to be skipped by setting post meta key `_wpas_skip_123` to a value of `1`.

#### Post Message
A message string can be added to the social media posts by setting the `_wpas_mess` to any user provided string.

#### Done Sharing
Publicize will only allow a post to be shared once. When a post is published, Publicize sets the `_wpas_done_all` post meta key. After a post has been flagged by `_wpas_done_all`, Publicize will not share it again.
