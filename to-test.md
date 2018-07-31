## 6.4

### Widgets

#### Top Posts Widget

We added new `jetpack_top_posts_widget_layout` filter that allows you to create a custom display layout for the Top Posts widget (which _might_ be used to extend Top Posts widget).

To test:

- Add 'Top Posts' Widget
- Make sure it works as expected

### Contact Form

We added a bit of flexibility to the data exporter and eraser so they can be tailored to the needs of different privacy and data retention policies.

To test (You will need ftp / ssh access to the test site):

- Enable Jetpack Contact Forms.
- Create a page and add a Jetpack Contact Form.
- Submit the form a couple of times with a test email address.
- Check that `Export Personal Data` & `Remove Personal Data` tool work as expected. You should find that exporting personal data includes a "Feedback" group containing the personal data that you submitted with the test email address. Removing personal data should remove the Feedback posts associated with the test email address.
- Copy this file (https://gist.github.com/coreymckrill/bed546ef05c9917d0d01618588a2c206) into the wp-content/mu-plugins folder.
- Perform the two tests separately, uncommenting the relevant lines to activate them.
- For Test 1, the result should be that the data export does not include feedback posts, and during data erasure, the feedback posts are not deleted.
- For Test 2, during erasure, you should see a message that personal data was found, but not erased, followed by the "because reasons" message.

**Thank you for all your help!**
