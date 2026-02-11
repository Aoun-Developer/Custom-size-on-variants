# Custom Size App - Debugging Guide

## Current Issues Observed

Based on the console errors in your screenshot:

### 1. ❌ Theme JavaScript Error (pickup_availability.js)
- **Error**: `TypeError: Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'.`
- **Location**: `pickup_availability.js:54` and `pickup_availability.js:35`
- **Impact**: This is a **Shopify theme bug**, not related to your custom size app
- **Fix**: This needs to be fixed in the theme code itself (see Theme Fixes section below)

### 2. ⚠️ Favicon 404 Errors
- **Impact**: Cosmetic only, doesn't affect functionality
- **Fix**: Add favicon files to your theme or ignore

### 3. ⚠️ Content Security Policy Violation
- **Impact**: Expected behavior, not an issue
- **Fix**: None needed

### 4. ⚠️ Web Pixels Error
- **Impact**: Shopify analytics/tracking issue
- **Fix**: Check Shopify pixel configuration if analytics are important

---

## ✅ Debugging Steps

### Step 1: Verify App Embed is Enabled

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Click the **App embeds** icon (🧩 puzzle piece) in the left sidebar
4. Find **"Custom Size Modal"** and toggle it **ON**
5. Click **Save**

### Step 2: Check Console Logs

With the updated debug logging, you should now see these messages in the browser console:

```
[Custom Size] Script loaded
[Custom Size] Container found: <div id="custom-size-modal-container">
[Custom Size] Shop: your-shop.myshopify.com
[Custom Size] Checking variant...
[Custom Size] Selected options: ['custom-size']
[Custom Size] Variant key: custom-size
[Custom Size] Fetching from: /apps/custom-size/api/custom-size?shop=...
[Custom Size] API response: { sets: [...], design: {...} }
[Custom Size] Rendering 1 set(s) with style: MODAL
```

**If you see:**
- ❌ `Container not found` → App embed is not enabled (see Step 1)
- ❌ `No product form found` → Theme structure issue
- ❌ `API returned error: 404` → Backend API not responding
- ❌ `No sets found` → No custom size configuration for this variant

### Step 3: Test the API Endpoint

Open browser console on the product page and run:

```javascript
// Replace with your actual shop domain
const shop = 'w0c21tz423wqsfh4-95859671410.myshopify.com';
const variant = 'custom-size';

fetch(`/apps/custom-size/api/custom-size?shop=${shop}&variant=${variant}`)
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    if (data.sets && data.sets.length > 0) {
      console.log('✅ Custom size configured for this variant');
    } else {
      console.log('❌ No custom size configuration found');
    }
  })
  .catch(err => console.error('API Error:', err));
```

### Step 4: Verify Variant Detection

In the console, check what variant is being detected:

```javascript
// Check the form
const form = document.querySelector('form[action^="/cart/add"]');
console.log('Form:', form);

// Check selected inputs
const inputs = form.querySelectorAll('input:checked, option:checked');
console.log('Selected inputs:', Array.from(inputs).map(i => i.value));
```

### Step 5: Manually Trigger Modal (Testing)

If everything is configured but the modal isn't showing, try manually triggering it:

```javascript
// This will be available after the script loads
// Check the console logs to see what's happening
```

---

## 🔧 Common Fixes

### Fix 1: App Embed Not Showing

**Problem**: Container not found in console logs

**Solution**:
1. Enable the app embed in theme customizer (see Step 1)
2. Make sure you're testing on the correct theme (preview vs live)
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Fix 2: API Not Responding

**Problem**: API returns 404 error

**Solution**:
1. Check that `npm run dev` is running
2. Verify the app is installed on the store
3. Check the Shopify app proxy configuration in `shopify.app.toml`
4. Look at the terminal output for any errors

### Fix 3: Modal Not Appearing for Variant

**Problem**: API returns empty sets

**Solution**:
1. Go to your app admin panel
2. Navigate to the custom size configuration page
3. Create a new custom size set
4. Set the variant handle to match exactly: `custom-size`
5. Save and test again

### Fix 4: Variant Not Being Detected

**Problem**: Console shows "No options selected"

**Solution**:
The variant detection might need adjustment for your theme. Check:
1. What variant selector your theme uses (radio buttons, dropdown, etc.)
2. The name attributes of the variant inputs
3. Consider updating the variant detection logic in `custom-size.js`

---

## 🐛 Theme Fixes (Optional)

### Fixing pickup_availability.js Error

This error is in the Shopify theme, not your app. To fix it:

1. Go to **Online Store** → **Themes** → **Edit code**
2. Find `assets/pickup_availability.js`
3. Look for lines around 35 and 54 where `appendChild` is called
4. The fix typically looks like this:

```javascript
// Before (causes error)
someNode.appendChild(element);

// After (fixed)
if (someNode && someNode.nodeType === 1) {
  someNode.appendChild(element);
}
```

Or ensure the parent element is an HTMLElement before appending.

---

## 📊 Expected Console Output

When everything is working correctly, you should see:

```
[Custom Size] Script loaded
[Custom Size] Container found: <div id="custom-size-modal-container" data-shop="...">
[Custom Size] Shop: w0c21tz423wqsfh4-95859671410.myshopify.com
[Custom Size] Checking variant...
[Custom Size] Selected options: ['custom-size']
[Custom Size] Variant key: custom-size
[Custom Size] Fetching from: /apps/custom-size/api/custom-size?shop=w0c21tz423wqsfh4-95859671410.myshopify.com&variant=custom-size
[Custom Size] API response: {sets: Array(1), design: {…}}
[Custom Size] Rendering 1 set(s) with style: MODAL
```

Then the modal should appear on the page!

---

## 🆘 Still Having Issues?

If you're still experiencing problems after following this guide:

1. **Share the console logs** - Copy all `[Custom Size]` messages
2. **Check the Network tab** - Look for the API request and share the response
3. **Verify the variant handle** - Make sure it matches exactly in your app configuration
4. **Check app installation** - Ensure the app is properly installed and has the correct scopes

---

## 📝 Quick Reference

### Important Files
- Extension: `extensions/custom-size-modal/assets/custom-size.js`
- CSS: `extensions/custom-size-modal/assets/custom-size.css`
- Liquid: `extensions/custom-size-modal/blocks/app-embed.liquid`

### Important Commands
- Start dev server: `npm run dev`
- View logs: Check terminal where `npm run dev` is running
- Deploy: Automatic when using `npm run dev`

### Important URLs
- Product page: `https://w0c21tz423wqsfh4-95859671410.shopifypreview.com/products/test-aj`
- API endpoint: `/apps/custom-size/api/custom-size?shop=SHOP&variant=VARIANT`
