
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('custom-size-modal-container');
    if (!container) return;

    const shop = container.dataset.shop;
    const productForm = document.querySelector('form[action="/cart/add"]');
    if (!productForm) return;

    let currentSet = null;
    let addToCartButton = productForm.querySelector('[name="add"], [type="submit"], button[type="submit"]');
    let buyNowButton = document.querySelector('[name="checkout"], .shopify-payment-button__button');

    // Helper to handleize string
    const handleize = (str) => {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Function to check variant and fetch data
    const checkVariant = async () => {
        const selectedOptions = Array.from(productForm.querySelectorAll('input:checked, option:checked'))
            .map(el => handleize(el.value || el.innerText))
            .filter(t => t);

        if (selectedOptions.length === 0) return;

        // Try app proxy first (works in production), fallback to direct API (for development)
        let apiUrl = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(selectedOptions.join(','))}`;

        console.log('[Custom Size] Fetching from:', apiUrl);

        try {
            let res = await fetch(apiUrl);

            // If proxy doesn't work (404 in development), try direct API route
            if (!res.ok && res.status === 404) {
                console.log('[Custom Size] Proxy not available, trying direct API');
                apiUrl = `/api/custom-size?shop=${shop}&variant=${encodeURIComponent(selectedOptions.join(','))}`;
                res = await fetch(apiUrl);
            }

            if (!res.ok) {
                console.error('[Custom Size] API error:', res.status);
                return;
            }
            const data = await res.json();
            console.log('[Custom Size] API response:', data);

            if (data.set) {
                currentSet = data.set;
                if (data.set.displayStyle === 'INLINE') {
                    renderInline(data.set);
                } else {
                    renderModal(data.set);
                }
            } else {
                currentSet = null;
                closeModal();
                removeInline();
                enableButtons();
            }
        } catch (e) {
            console.error("Error fetching custom size set", e);
        }
    };

    // Disable/Enable buttons
    const disableButtons = () => {
        if (addToCartButton) {
            addToCartButton.disabled = true;
            addToCartButton.style.opacity = '0.5';
            addToCartButton.style.cursor = 'not-allowed';
        }
        if (buyNowButton) {
            buyNowButton.disabled = true;
            buyNowButton.style.opacity = '0.5';
            buyNowButton.style.cursor = 'not-allowed';
        }
    };

    const enableButtons = () => {
        if (addToCartButton) {
            addToCartButton.disabled = false;
            addToCartButton.style.opacity = '1';
            addToCartButton.style.cursor = 'pointer';
        }
        if (buyNowButton) {
            buyNowButton.disabled = false;
            buyNowButton.style.opacity = '1';
            buyNowButton.style.cursor = 'pointer';
        }
    };

    // Validate inputs
    const validateInputs = (container) => {
        const inputs = container.querySelectorAll('.custom-size-input');
        let allFilled = true;
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value) {
                allFilled = false;
            }
        });

        // Check nearest size if required
        if (currentSet && currentSet.reqNearestSize) {
            const nearestSizeSelect = container.querySelector('.custom-size-nearest-size');
            if (nearestSizeSelect && !nearestSizeSelect.value) {
                allFilled = false;
            }
        }

        if (allFilled) {
            enableButtons();
        } else {
            disableButtons();
        }
    };

    // Render Inline
    const renderInline = (set) => {
        removeInline(); // Remove existing
        disableButtons();

        const inlineContainer = document.createElement('div');
        inlineContainer.id = 'custom-size-inline-container';
        inlineContainer.className = 'custom-size-inline';

        let nearestSizeHTML = '';
        if (set.reqNearestSize) {
            // Fetch size options from product
            const sizeOptions = Array.from(productForm.querySelectorAll('select[name*="Size"] option, input[name*="Size"]'))
                .map(el => el.value || el.innerText)
                .filter(val => val && val.toLowerCase() !== 'custom-size' && val.toLowerCase() !== 'custom size');

            if (sizeOptions.length > 0) {
                nearestSizeHTML = `
                    <div class="custom-size-field">
                        <label>Please select one option from nearest size*</label>
                        <select class="custom-size-nearest-size custom-size-input" name="properties[Nearest Size]" required>
                            <option value="">Choose your nearest size</option>
                            ${sizeOptions.map(size => `<option value="${size}">${size}</option>`).join('')}
                        </select>
                    </div>
                `;
            }
        }

        inlineContainer.innerHTML = `
            ${set.noteTitle || set.noteContent ? `
                <div class="custom-size-note">
                    ${set.noteTitle ? `<h3>${set.noteTitle}</h3>` : ''}
                    ${set.noteContent ? `<p>${set.noteContent.replace(/\n/g, '<br>')}</p>` : ''}
                </div>
            ` : ''}
            ${set.imageUrl ? `<img src="${set.imageUrl}" alt="${set.name}" class="custom-size-inline-image" />` : ''}
            <div class="custom-size-fields">
                ${nearestSizeHTML}
                ${set.fields.map(field => `
                    <div class="custom-size-field">
                        <label>${field.label}${field.required ? '*' : ''}</label>
                        <input type="${field.type}" name="properties[${field.label}]" ${field.required ? 'required' : ''} class="custom-size-input" placeholder="IN INCHES" />
                    </div>
                `).join('')}
            </div>
        `;

        // Insert after variant selector
        const variantSelector = productForm.querySelector('.product-form__input, .product-single__variants, [class*="variant"]');
        if (variantSelector) {
            variantSelector.after(inlineContainer);
        } else {
            productForm.prepend(inlineContainer);
        }

        // Add event listeners for validation
        inlineContainer.querySelectorAll('.custom-size-input').forEach(input => {
            input.addEventListener('input', () => validateInputs(inlineContainer));
            input.addEventListener('change', () => validateInputs(inlineContainer));
        });

        // Initial validation
        validateInputs(inlineContainer);

        // Append inputs to form on submit
        productForm.addEventListener('submit', (e) => {
            if (currentSet && currentSet.displayStyle === 'INLINE') {
                appendInputsToForm(inlineContainer);
            }
        });
    };

    const removeInline = () => {
        const existing = document.getElementById('custom-size-inline-container');
        if (existing) existing.remove();
    };

    // Render Modal
    const renderModal = (set) => {
        if (document.getElementById('custom-size-modal-overlay')) return;
        disableButtons();

        const overlay = document.createElement('div');
        overlay.id = 'custom-size-modal-overlay';
        overlay.className = 'custom-size-modal-overlay';

        let nearestSizeHTML = '';
        if (set.reqNearestSize) {
            const sizeOptions = Array.from(productForm.querySelectorAll('select[name*="Size"] option, input[name*="Size"]'))
                .map(el => el.value || el.innerText)
                .filter(val => val && val.toLowerCase() !== 'custom-size' && val.toLowerCase() !== 'custom size');

            if (sizeOptions.length > 0) {
                nearestSizeHTML = `
                    <div class="custom-size-field">
                        <label>Please select one option from nearest size*</label>
                        <select class="custom-size-nearest-size custom-size-input" name="properties[Nearest Size]" required>
                            <option value="">Choose your nearest size</option>
                            ${sizeOptions.map(size => `<option value="${size}">${size}</option>`).join('')}
                        </select>
                    </div>
                `;
            }
        }

        overlay.innerHTML = `
            <div class="custom-size-modal">
                <div class="custom-size-header">
                    ${set.imageUrl ? `<img src="${set.imageUrl}" alt="${set.name}" />` : ''}
                    <h2>${set.name}</h2>
                    <button class="custom-size-close">&times;</button>
                </div>
                ${set.noteTitle || set.noteContent ? `
                    <div class="custom-size-note">
                        ${set.noteTitle ? `<h3>${set.noteTitle}</h3>` : ''}
                        ${set.noteContent ? `<p>${set.noteContent.replace(/\n/g, '<br>')}</p>` : ''}
                    </div>
                ` : ''}
                <div class="custom-size-body">
                    <div class="custom-size-fields">
                        ${nearestSizeHTML}
                        ${set.fields.map(field => `
                            <div class="custom-size-field">
                                <label>${field.label}${field.required ? '*' : ''}</label>
                                <input type="${field.type}" name="properties[${field.label}]" ${field.required ? 'required' : ''} class="custom-size-input" placeholder="IN INCHES" />
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="custom-size-footer">
                    <button class="custom-size-save-btn">Save Measurements</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add event listeners for validation
        overlay.querySelectorAll('.custom-size-input').forEach(input => {
            input.addEventListener('input', () => validateInputs(overlay));
            input.addEventListener('change', () => validateInputs(overlay));
        });

        // Initial validation
        validateInputs(overlay);

        // Close handlers
        overlay.querySelector('.custom-size-close').addEventListener('click', closeModal);
        overlay.querySelector('.custom-size-save-btn').addEventListener('click', (e) => {
            e.preventDefault();

            // Validate
            const inputs = overlay.querySelectorAll('input[required], select[required]');
            let valid = true;
            inputs.forEach(input => {
                if (!input.value) {
                    valid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });

            if (!valid) {
                alert('Please fill in all required fields');
                return;
            }

            appendInputsToForm(overlay);
            closeModal();
            enableButtons();
        });
    };

    const closeModal = () => {
        const overlay = document.getElementById('custom-size-modal-overlay');
        if (overlay) overlay.remove();
    };

    const appendInputsToForm = (container) => {
        // Remove old hidden inputs
        const old = productForm.querySelectorAll('.custom-size-hidden-input');
        old.forEach(el => el.remove());

        const inputs = container.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.value) {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = input.name;
                hidden.value = input.value;
                hidden.className = 'custom-size-hidden-input';
                productForm.appendChild(hidden);
            }
        });
    };

    // Init
    setInterval(checkVariant, 1000);
});
