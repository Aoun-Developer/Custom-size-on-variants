// Quick test script to verify custom size configuration
// Run this in the browser console on your product page

(async function testCustomSize() {
    console.log('=== Custom Size Configuration Test ===\n');

    // 1. Check if container exists
    const container = document.getElementById('custom-size-modal-container');
    console.log('1. Container exists:', !!container);
    if (container) {
        console.log('   Shop:', container.dataset.shop);
    } else {
        console.error('   ❌ Container not found - App embed may not be enabled');
        console.log('   → Go to Theme Customizer → App embeds → Enable "Custom Size Modal"');
        return;
    }

    // 2. Check if script is loaded
    console.log('\n2. Checking if custom-size.js is loaded...');
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
    const customSizeScript = scripts.find(s => s.includes('custom-size'));
    console.log('   Script found:', !!customSizeScript);
    if (customSizeScript) {
        console.log('   URL:', customSizeScript);
    }

    // 3. Check form
    console.log('\n3. Checking product form...');
    const form = document.querySelector('form[action^="/cart/add"]');
    console.log('   Form exists:', !!form);
    if (form) {
        console.log('   Form ID:', form.id || '(no ID)');
    }

    // 4. Check selected variant
    console.log('\n4. Checking selected variant...');
    const inputs = form ? form.querySelectorAll('input:checked, option:checked') : [];
    const values = Array.from(inputs).map(i => i.value || i.innerText).filter(v => v);
    console.log('   Selected values:', values);

    const handleize = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const variantKey = values.map(handleize).sort().join(',');
    console.log('   Variant key:', variantKey);

    // 5. Test API
    console.log('\n5. Testing API endpoint...');
    const shop = container.dataset.shop;
    const apiUrl = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(variantKey)}`;
    console.log('   URL:', apiUrl);

    try {
        const response = await fetch(apiUrl);
        console.log('   Status:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('   Response:', data);

            if (data.sets && data.sets.length > 0) {
                console.log('\n✅ SUCCESS! Custom size is configured for this variant');
                console.log('   Sets found:', data.sets.length);
                data.sets.forEach((set, i) => {
                    console.log(`   Set ${i + 1}:`, set.name, `(${set.displayStyle})`);
                });
                if (data.design) {
                    console.log('   Design settings:', data.design);
                }
            } else {
                console.log('\n⚠️ No custom size sets configured for variant:', variantKey);
                console.log('   → Go to your app admin and create a custom size set');
                console.log('   → Set the trigger variant to:', variantKey);
            }
        } else {
            console.error('   ❌ API error:', response.status);
            if (response.status === 404) {
                console.log('   → Check that npm run dev is running');
                console.log('   → Verify app proxy configuration');
            }
        }
    } catch (error) {
        console.error('   ❌ Fetch error:', error);
    }

    console.log('\n=== Test Complete ===');
})();
