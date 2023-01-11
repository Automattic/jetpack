# Paid Newsletters

A post-level settings that allow users to make a post as paid-subscriber only, subscriber only or for everyone.

## Test cases


### 1. A post with a post level setting of "everybody" should be viewable by everyone

1. Create a post with a post-level setting of "everybody"
2. View the post in an incognito window
3. The post should be visible


### 2. A post with a post level setting of "subscriber-only" should be viewable to only subscribers

1. Create a post with a post-level setting of "subscriber-only"
2. View the post in an incognito window
3. The post and comments should be **not** be visible
4. Sign up as a free subscriber and the post and comments should immediately be unlocked
5. Sign up as a paid subscriber and the post and comments should immediately be unlocked

### 3. A post with a post level setting of "paid-subscribers" should be viewable to only paid subscribers

1. Create a post with a post-level setting of "paid-subscriber"
2. View the post in an incognito window
3. The post and comments should be **not** be visible
4. Attempt to sign up as a free subscriber and notice that the free option is not available
5. Sign up as a paid subscriber and the post and comments should immediately be unlocked


### 4. Subscribe with an existing subscriber

1. Create a post with a post-level setting of "subscriber"
2. In an incognito window enter the email address of an existing subscriber and click the "Subscribe" button
3. A modal should popup requesting a 4 digit code to sign in
4. Enter the 4 digit code sent to the subscriber's email
5. The subscriber should be granted access to the content
6. Repeat step 1 for a post with a post-level setting of "paid-subscriber"
