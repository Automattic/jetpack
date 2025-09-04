# Help Center Redesign - Call for Testing

## Overview
We need volunteers to test the new **Cohesive Support Experience** changes that redesign the Help Center interface across WordPress.com environments. This testing focuses on the Help Center interface improvements using core components and enhanced user experience.

## What We're Testing
The main changes include:
1. **Redesigned Help Center Interface** - Updated UI using WordPress core components
2. **Enhanced Admin Bar Integration** - Improved Help Center icon and functionality 
3. **Next Admin Support** - Help Center now works in the new WordPress.com admin interface
4. **Support Site Integration** - Help Center added to wp.com/support homepage
5. **Improved Support Link Handling** - Support links throughout WordPress.com now open in Help Center
6. **Better User Experience** - Persistent state, improved translations, and better error handling

---

## Testing Environment Setup

### Prerequisites
- Access to a WordPress.com site (Simple or Atomic)
- Admin access to test sites
- Different browsers for cross-browser testing
- Both connected and disconnected Jetpack states (for Atomic sites)

### Test Sites Needed
- **Simple Site** (WordPress.com hosted)
- **Atomic Site** (WordPress.com with plugins) - both connected and disconnected from Jetpack
- **Support Site** (if you have access to wp.com/support)

---

## Test Scenarios

### 1. Help Center Icon & Access Testing

#### Test 1.1: Admin Bar Help Center Icon
**What to test:** Help Center icon appears correctly in the admin bar

**Steps:**
1. Log into your WordPress.com site admin dashboard
2. Look at the top admin bar (black bar at top of screen)
3. Verify you see a Help icon (❓) in the top-right area
4. Click the Help icon
5. Verify the Help Center opens (either as overlay or new tab)

**Expected Results:**
- Help icon is visible and properly styled
- Icon is positioned correctly in admin bar
- Clicking opens Help Center interface
- Help Center loads without errors

**Test on:** Simple sites, Atomic sites (connected), Atomic sites (disconnected)

#### Test 1.2: Block Editor Help Center Integration
**What to test:** Help Center works in the block editor (Gutenberg)

**Steps:**
1. Go to Posts > Add New or Pages > Add New
2. Verify you're in the block editor interface
3. Look for the Help Center icon in the top toolbar
4. Click the Help Center icon
5. Verify Help Center opens and functions properly

**Expected Results:**
- Help icon appears in block editor interface
- Help Center opens without interfering with editor
- All Help Center features work within editor context

**Test on:** Simple sites, Atomic sites

#### Test 1.3: Frontend Help Center (for editors)
**What to test:** Help Center appears on site frontend for users who can edit

**Steps:**
1. While logged in as an admin/editor, visit your site's frontend
2. Look for the admin bar at the top
3. Verify Help Center icon is present
4. Click the Help Center icon
5. Test Help Center functionality

**Expected Results:**
- Admin bar shows on frontend for editors
- Help Center icon is visible and functional
- Help Center opens and works properly on frontend

### 2. Next Admin Integration Testing

#### Test 2.1: Help Center in Next Admin Interface
**What to test:** Help Center works in the new WordPress.com admin interface

**Steps:**
1. Access your site through the new WordPress.com admin interface (if available)
2. Look for Help Center icon in the interface
3. Click the Help Center icon
4. Test various Help Center features
5. Navigate between different admin sections and verify Help Center persists

**Expected Results:**
- Help Center integrates seamlessly with Next Admin
- Icon appears in correct location
- All functionality works as expected
- State persists across navigation

### 3. Support Link Integration Testing

#### Test 3.1: Block Description Support Links
**What to test:** Support links in block descriptions open in Help Center

**Steps:**
1. In block editor, add various blocks (especially Grid block)
2. Look for "Learn more" or support links in block descriptions
3. Click these support links
4. Verify they open in Help Center instead of new tabs

**Expected Results:**
- Support links open Help Center overlay
- Relevant documentation appears in Help Center
- No external tabs opened for support content

#### Test 3.2: Settings Page Support Links
**What to test:** Support links in Settings pages open in Help Center

**Steps:**
1. Go to Settings > General (and other settings pages)
2. Look for any support links or "Learn more" links
3. Click these links
4. Verify they open in Help Center

**Expected Results:**
- Settings support links open Help Center
- Relevant help content is displayed
- User stays within WordPress.com interface

#### Test 3.3: Media Export Support Link
**What to test:** Media export "Learn more" link opens in Help Center

**Steps:**
1. Go to Tools > Export (if available)
2. Look for media export section
3. Click "Learn more" link for media library export
4. Verify Help Center opens with relevant content

**Expected Results:**
- Media export help opens in Help Center
- Correct documentation is displayed

### 4. Support Site Testing (wp.com/support)

#### Test 4.1: Help Center on Support Homepage
**What to test:** Help Center is available on wp.com/support

**Steps:**
1. Visit wordpress.com/support
2. Look for Help Center integration
3. Test Help Center functionality from support site
4. Verify all features work correctly

**Expected Results:**
- Help Center is accessible from support site
- Full functionality is available
- Integration feels seamless

### 5. Disconnected State Testing

#### Test 5.1: Jetpack Disconnected Help Center
**What to test:** Help Center works when Jetpack is disconnected

**Steps:**
1. On an Atomic site, disconnect from Jetpack
2. Check admin bar for Help Center icon
3. Click Help Center icon
4. Verify it redirects to wordpress.com/help

**Expected Results:**
- Help icon still appears when disconnected
- Clicking redirects to wordpress.com/help
- No JavaScript errors occur

### 6. Cross-Browser & Device Testing

#### Test 6.1: Browser Compatibility
**What to test:** Help Center works across different browsers

**Steps:**
1. Test all above scenarios in:
   - Chrome/Chromium
   - Firefox
   - Safari (if on Mac)
   - Edge
2. Verify consistent behavior

#### Test 6.2: Mobile Responsiveness
**What to test:** Help Center works on mobile devices

**Steps:**
1. Access WordPress.com admin on mobile device
2. Test Help Center icon visibility and functionality
3. Verify Help Center interface is mobile-friendly

### 7. Translation & Localization Testing

#### Test 7.1: Non-English Locales
**What to test:** Help Center works in different languages

**Steps:**
1. Change site language to non-English (e.g., Spanish, French)
2. Test Help Center functionality
3. Verify translations load correctly
4. Check that Help Center content appears in correct language

**Expected Results:**
- Help Center interface appears in selected language
- Translations load from widgets.wp.com/help-center/languages
- No English fallbacks where translations should exist

---

## What to Report

### For Each Test:
1. **Environment Details:**
   - Site type (Simple/Atomic)
   - Browser and version
   - Device type (desktop/mobile)
   - WordPress.com plan
   - Jetpack connection status

2. **Results:**
   - ✅ **Pass:** Feature works as expected
   - ❌ **Fail:** Feature doesn't work or has issues
   - ⚠️ **Partial:** Works but with minor issues

3. **Issues Found:**
   - Describe what went wrong
   - Steps to reproduce
   - Screenshots if helpful
   - Browser console errors (if any)

### Critical Issues to Watch For:
- Help Center icon not appearing
- JavaScript errors in browser console
- Help Center not opening or loading
- Support links still opening external tabs instead of Help Center
- Translation issues
- Mobile layout problems
- Performance issues or slow loading

---

## Reporting Results

Please report your testing results with:

1. **Test Environment:**
   ```
   Site Type: [Simple/Atomic]
   Plan: [Free/Personal/Premium/Business/eCommerce]
   Browser: [Chrome 120/Firefox 118/Safari 17/etc.]
   Device: [Desktop/Mobile/Tablet]
   Jetpack Status: [Connected/Disconnected/N/A]
   ```

2. **Test Results Summary:**
   - List each test scenario with Pass/Fail/Partial status
   - Include any specific issues encountered

3. **Screenshots:** 
   - Help Center interface
   - Any error states
   - Mobile views

4. **Additional Feedback:**
   - User experience observations
   - Performance notes
   - Suggestions for improvements

---

## Priority Testing Areas

**High Priority:**
1. Admin bar Help Center icon functionality
2. Help Center opening and basic navigation
3. Support links redirecting to Help Center (instead of external tabs)
4. Next Admin integration (if available)

**Medium Priority:**
5. Block editor integration
6. Frontend Help Center for editors
7. Mobile responsiveness
8. Translation testing

**Low Priority:**
9. Cross-browser compatibility
10. Performance testing
11. Edge cases (disconnected states, etc.)

---

## Timeline
Please complete testing by **[INSERT DEADLINE]** and report results via **[INSERT REPORTING METHOD - Slack/Email/Form]**.

## Questions?
If you have questions about testing or encounter issues with the testing process itself, please reach out to **[INSERT CONTACT INFO]**.

Thank you for helping improve the WordPress.com Help Center experience! 🙏