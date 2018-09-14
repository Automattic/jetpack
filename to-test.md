## 6.6

### Lazy Images

We've made some changes to the Lazy Images feature in this release. You'll want to make sure none of the images on your site are broken after this release. In addition to this, you can make the following tests:

1. Ensure that lazy images module is on
2. Create a post/page with images in it
3. View source on page load and ensure that the placeholder is loaded via the `srcset` attribute
4. After scrolling down, ensure the image loads properly and the `srcset` attribute now contains the actual images OR the `srcset` attribute has been removed in favor of just using `src`.

**Thank you for all your help!**
