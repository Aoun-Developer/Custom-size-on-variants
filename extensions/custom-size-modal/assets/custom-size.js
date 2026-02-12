document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('custom-size-modal-container');
    if (!container) return;

    const shop = container.dataset.shop;
    let currentSet = null;
    let currentDesign = null;
    let lastChecked = '';

    const getProductForm = () => document.querySelector('form[action^="/cart/add"]');

    const getButtons = () => {
        const form = getProductForm();
        return {
            add: form?.querySelector('[name="add"], [type="submit"], button[type="submit"]'),
            buy: document.querySelector('[name="checkout"], .shopify-payment-button__button')
        };
    };

    const handleize = str => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const checkVariant = async () => {
        const form = getProductForm();
        if (!form) return;

        let inputs = [...form.querySelectorAll('input:checked, option:checked')];
        const formId = form.getAttribute('id');
        if (formId) inputs.push(...document.querySelectorAll(`input[form="${formId}"]:checked, option[form="${formId}"]:checked`));
        if (inputs.length === 0) inputs.push(...document.querySelectorAll('variant-radios input:checked, variant-selects option:checked, .product-form__input input:checked'));

        const uniqueValues = new Set([...inputs].map(el => el.value || el.innerText).filter(v => v));
        const selectedOptions = Array.from(uniqueValues).map(handleize).filter(t => t);
        const variantKey = selectedOptions.sort().join(',');

        if (variantKey === lastChecked) return;
        lastChecked = variantKey;

        if (selectedOptions.length === 0) return;

        try {
            let apiUrl = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(variantKey)}`;
            let res = await fetch(apiUrl);

            if (!res.ok && res.status === 404) {
                apiUrl = `/api/custom-size?shop=${shop}&variant=${encodeURIComponent(variantKey)}`;
                res = await fetch(apiUrl);
            }

            if (!res.ok) return;
            const data = await res.json();

            let sets = [];
            if (data.sets && Array.isArray(data.sets)) {
                sets = data.sets;
            } else if (data.set) {
                sets = [data.set];
            }

            if (data.design) {
                currentDesign = data.design;
                applyDesign(data.design);
            }

            if (sets.length > 0) {
                currentSet = sets;
                const style = sets[0].displayStyle;
                style === 'INLINE' ? renderInline(sets) : renderModal(sets, currentDesign);
            } else {
                currentSet = null;
                closeModal();
                removeInline();
                toggleButtons(true);
            }
        } catch (e) { console.error('[Custom Size]', e); }
    };

    const applyDesign = (design) => {
        let style = document.getElementById('custom-size-design-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'custom-size-design-styles';
            document.head.appendChild(style);
        }

        let modalStyles = [];
        let inputStyles = [];
        let placeholderStyles = [];
        let titleStyles = [];
        let noteStyles = [];

        if (design.modalBgColor) modalStyles.push(`background-color: ${design.modalBgColor} !important;`);

        if (design.borderWidth != null) inputStyles.push(`border-width: ${design.borderWidth}px !important;`);
        if (design.borderStyle) inputStyles.push(`border-style: ${design.borderStyle} !important;`);
        if (design.borderColor) inputStyles.push(`border-color: ${design.borderColor} !important;`);
        if (design.textColor) inputStyles.push(`color: ${design.textColor} !important;`);

        if (design.placeholderColor) placeholderStyles.push(`color: ${design.placeholderColor} !important;`);

        if (design.titleColor) titleStyles.push(`color: ${design.titleColor} !important;`);

        if (design.noteColor) noteStyles.push(`color: ${design.noteColor} !important;`);
        if (design.noteBgColor) noteStyles.push(`background-color: ${design.noteBgColor} !important;`);

        style.innerHTML = `
            ${modalStyles.length ? `.custom-size-modal { ${modalStyles.join(' ')} }` : ''}
            ${modalStyles.length ? `.custom-size-inline { ${modalStyles.join(' ')} }` : ''}
            ${inputStyles.length ? `.custom-size-input { ${inputStyles.join(' ')} }` : ''}
            ${placeholderStyles.length ? `.custom-size-input::placeholder { ${placeholderStyles.join(' ')} }` : ''}
            ${titleStyles.length ? `.custom-size-header h2, .custom-size-set-section h3, .custom-size-set-block h3 { ${titleStyles.join(' ')} }` : ''}
            ${noteStyles.length ? `.custom-size-note { ${noteStyles.join(' ')} }` : ''}
            ${design.customCss || ''}
        `;
    };

    const toggleButtons = (enable) => {
        const { add, buy } = getButtons();
        [add, buy].forEach(btn => {
            if (btn) {
                btn.disabled = !enable;
                btn.style.opacity = enable ? '1' : '0.5';
                btn.style.cursor = enable ? 'pointer' : 'not-allowed';
            }
        });
    };

    const validateInputs = (scope) => {
        const required = Array.from(scope.querySelectorAll('.custom-size-input[required]'));
        let valid = required.every(input => input.value);

        // reqNearestSize handled by required attribute on select

        toggleButtons(valid);
    };

    const renderInline = (sets) => {
        removeInline();
        toggleButtons(false);

        const div = document.createElement('div');
        div.id = 'custom-size-inline-container';
        div.className = 'custom-size-inline';
        div.style.marginTop = '15px';
        div.style.marginBottom = '15px';

        div.innerHTML = sets.map(set => `<div class="custom-size-set-block">${buildHtml(set)}</div>`).join('<hr class="custom-size-divider" style="margin: 15px 0; border: 0; border-top: 1px solid #eee;" />');

        const form = getProductForm();
        if (form) {
            const buttons = form.querySelector('.product-form__buttons, .shopify-payment-button, [name="add"]');
            if (buttons) {
                const container = buttons.closest('.product-form__buttons') || buttons;
                container.before(div);
            } else {
                const variants = form.querySelectorAll('variant-radios, variant-selects, fieldset.product-form__input, [class*="variant"]');
                if (variants.length > 0) {
                    variants[variants.length - 1].after(div);
                } else {
                    form.appendChild(div);
                }
            }

            form.addEventListener('submit', () => {
                if (currentSet && currentSet[0].displayStyle === 'INLINE') appendInputs(div);
            });
        }

        div.querySelectorAll('.custom-size-input').forEach(i =>
            i.addEventListener('input', () => validateInputs(div)));

        validateInputs(div);
    };

    const removeInline = () => document.getElementById('custom-size-inline-container')?.remove();

    const renderModal = (sets, design) => {
        if (document.getElementById('custom-size-modal-overlay')) return;
        toggleButtons(false);

        const overlay = document.createElement('div');
        overlay.id = 'custom-size-modal-overlay';
        overlay.className = 'custom-size-modal-overlay';

        // Check if any set has a horizontal layout (set-specific or global default)
        const isGlobalHorizontal = currentDesign?.imageLayout === 'horizontal';
        const hasHorizontal = sets.some(s => s.imagePosition === 'left' || s.imagePosition === 'right') || isGlobalHorizontal;
        const modalClass = hasHorizontal ? 'custom-size-modal custom-size-modal-wide' : 'custom-size-modal';

        overlay.innerHTML = `
            <div class="${modalClass}">
                <div class="custom-size-header">
                    <h2>Custom Size</h2>
                    <button class="custom-size-close">&times;</button>
                </div>
                <div class="custom-size-body">
                    ${sets.map(set => `
                        <div class="custom-size-set-section">
                            <h3 style="margin-bottom: 15px; font-size: 1.1em;">${set.name}</h3>
                            ${buildSetContent(set)}
                        </div>
                    `).join('<hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;" />')}
                </div>
                <div class="custom-size-footer"><button class="custom-size-save-btn">Save Measurements</button></div>
            </div>`;

        document.body.appendChild(overlay);

        const inputs = overlay.querySelectorAll('.custom-size-input');
        inputs.forEach(i => i.addEventListener('input', () => validateInputs(overlay)));
        validateInputs(overlay);

        overlay.querySelector('.custom-size-close').addEventListener('click', closeModal);
        overlay.querySelector('.custom-size-save-btn').addEventListener('click', (e) => {
            e.preventDefault();
            const invalid = Array.from(inputs).filter(i => i.hasAttribute('required') && !i.value);
            if (invalid.length) {
                invalid.forEach(i => i.classList.add('error'));
                alert('Please fill in all required fields');
                return;
            }
            appendInputs(overlay);
            closeModal();
            toggleButtons(true);
        });
    };

    const closeModal = () => document.getElementById('custom-size-modal-overlay')?.remove();

    const appendInputs = (container) => {
        const form = getProductForm();
        if (!form) return;
        form.querySelectorAll('.custom-size-hidden-input').forEach(e => e.remove());
        container.querySelectorAll('input, select').forEach(i => {
            if (i.value) {
                const h = document.createElement('input');
                h.type = 'hidden';
                h.name = i.name;
                h.value = i.value;
                h.className = 'custom-size-hidden-input';
                form.appendChild(h);
            }
        });
    };

    const buildSetContent = (set) => {
        const imgStyle = `width: ${set.imageWidth || 'auto'}; height: ${set.imageHeight || 'auto'}; object-fit: contain; max-width: 100%;`;
        const imgContainerStyle = set.imageContainerWidth ? `flex: 0 0 ${set.imageContainerWidth}; max-width: ${set.imageContainerWidth};` : '';
        const fieldsContainerStyle = set.fieldsContainerWidth ? `flex: 0 0 ${set.fieldsContainerWidth}; max-width: ${set.fieldsContainerWidth};` : '';
        const imgHtml = set.imageUrl ? `
            <div class="custom-size-image-container" style="${imgContainerStyle}">
                <img src="${set.imageUrl}" alt="${set.name}" style="${imgStyle}" />
            </div>` : '';

        const fieldsHtml = `
            <div class="custom-size-fields-wrapper" style="${fieldsContainerStyle}">
                <div class="custom-size-fields">
                    ${buildNearestSizeHtml(set)}
                    ${set.fields.map(f => `
                        <div class="custom-size-field">
                            <label>${f.label}${f.required ? '*' : ''}</label>
                            <input type="${f.type}" name="properties[${f.label}]" ${f.required ? 'required' : ''} class="custom-size-input" placeholder="${f.placeholder || 'IN INCHES'}" />
                        </div>
                    `).join('')}
                </div>
            </div>`;

        // Use set-specific position or fallback to global design layout
        let position = set.imagePosition || 'top';
        if (position === 'top' && currentDesign?.imageLayout === 'horizontal') {
            position = 'left';
        }

        const layoutClass = `custom-size-layout-${position}`;
        const isReverse = position === 'bottom' || position === 'right';

        return `
            ${buildNoteHtml(set)}
            <div class="custom-size-set-layout ${layoutClass}">
                ${isReverse ? fieldsHtml + imgHtml : imgHtml + fieldsHtml}
            </div>`;
    };

    const buildHtml = (set) => `
        <div class="custom-size-set-block">
            <h3 style="margin-bottom: 15px; font-size: 1.1em;">${set.name}</h3>
            ${buildSetContent(set)}
        </div>`;

    const buildNoteHtml = (set) => (set.noteTitle || set.noteContent) ? `
        <div class="custom-size-note">
            ${set.noteTitle ? `<h3>${set.noteTitle}</h3>` : ''}
            ${set.noteContent ? `<p>${set.noteContent.replace(/\n/g, '<br>')}</p>` : ''}
        </div>` : '';

    const buildNearestSizeHtml = (set) => {
        if (!set.reqNearestSize) return '';
        const form = getProductForm();
        const opts = Array.from(form ? form.querySelectorAll('select[name*="Size"] option, input[name*="Size"]') : [])
            .map(e => e.value || e.innerText)
            .filter(v => v && !v.toLowerCase().includes('custom'));

        return opts.length ? `
            <div class="custom-size-field">
                <label>Please select one option from nearest size*</label>
                <select class="custom-size-nearest-size custom-size-input" name="properties[Nearest Size]" required>
                    <option value="">Choose your nearest size</option>
                    ${opts.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>` : '';
    };

    // Instant check
    checkVariant();

    // Event listener for faster updates
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"], select, option, input[name*="option"]')) {
            setTimeout(checkVariant, 50); // Small delay to allow value to update
        }
    });

    setInterval(checkVariant, 2000); // Polling as fallback
});
