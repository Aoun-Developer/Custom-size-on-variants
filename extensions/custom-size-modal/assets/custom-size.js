document.addEventListener('DOMContentLoaded', () => {
    const init = () => {
        const ctBlock = document.getElementById('custom-size-block-container');
        const ctEmbed = document.getElementById('custom-size-modal-container');
        const ct = ctBlock || ctEmbed;

        if (!ct) {
            console.log('[Custom Size] Containers not found. Ensure App Block or App Embed is enabled.');
            return;
        }
        const shop = ct.dataset.shop;
        console.log('[Custom Size] Initialized for shop:', shop);

        let cs = null, cd = null, lc = '';

        const getF = () => document.querySelector('form[action^="/cart/add"]');
        const getB = () => {
            const f = getF();
            const fId = f?.getAttribute('id');
            let a = f?.querySelector('[name="add"],[type="submit"],button[type="submit"]');
            if (!a && fId) a = document.querySelector(`[form="${fId}"][name="add"],[form="${fId}"][type="submit"]`);
            if (!a) a = document.querySelector('.product-form__submit, .add-to-cart, #AddToCart');

            let b = document.querySelector('[name="checkout"],.shopify-payment-button__button,.shopify-payment-button [role="button"]');
            if (!b && fId) b = document.querySelector(`[form="${fId}"] .shopify-payment-button__button`);

            return { add: a, buy: b };
        };

        const h = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        const cV = async () => {
            const f = getF();
            if (!f) return;

            // Robust Variant Detection
            let i = [...f.querySelectorAll('input:checked, option:checked')];
            const fId = f.getAttribute('id');
            if (fId) i.push(...document.querySelectorAll(`input[form="${fId}"]:checked, option[form="${fId}"]:checked`));

            // Fallback for custom swatch systems (active classes)
            const selectors = [
                'variant-radios input:checked',
                'variant-selects option:checked',
                '.product-form__input input:checked',
                '[aria-checked="true"]',
                '.is-active',
                '.selected',
                '.active',
                'fieldset input:checked',
                'label.active',
                'label.selected'
            ];
            i.push(...document.querySelectorAll(selectors.join(',')));

            // Even more robust: check for labels that look selected
            document.querySelectorAll('.product-form__input label, .variant-picker label, label[for^="Option"]').forEach(l => {
                const style = window.getComputedStyle(l);
                // Many themes use black bg or specific border for selected
                if (style.backgroundColor === 'rgb(0, 0, 0)' || style.backgroundColor === '#000' || l.classList.contains('selected')) {
                    i.push(l);
                }
            });

            const rawVals = i.map(e => {
                const val = e.value || e.dataset.value || e.innerText || e.dataset.name || e.getAttribute('aria-label');
                return val;
            }).filter(Boolean);

            const v = [...new Set(rawVals)].map(h).sort().join(',');

            if (v === lc) return;
            lc = v;

            console.log('[Custom Size] Detected variant handles:', v);
            if (!v) {
                console.log('[Custom Size] No variants detected. Raw values found:', rawVals);
                return;
            }

            try {
                // Try Proxy First
                let u = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(v)}`;
                console.log('[Custom Size] Fetching from:', u);
                let r = await fetch(u);

                // If 404/Fail, try local API root (some proxies misconfigured)
                if (!r.ok) {
                    u = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(v)}`; // Re-check path
                    // Try direct if proxy fails to resolve path correctly
                    if (r.status === 404) {
                        const fallbackUrl = `/api/custom-size?shop=${shop}&variant=${encodeURIComponent(v)}`;
                        console.log('[Custom Size] Proxy 404, trying fallback:', fallbackUrl);
                        r = await fetch(fallbackUrl);
                    }
                }

                if (!r.ok) {
                    console.warn('[Custom Size] API response not OK:', r.status);
                    return;
                }

                const d = await r.json();
                console.log('[Custom Size] API Data Received:', d);

                if (d.design) {
                    cd = d.design;
                    aD(d.design)
                }

                const s = d.sets || (d.set ? [d.set] : []);
                if (s.length) {
                    cs = s;
                    const ds = cd?.displayStyle || s[0].displayStyle;
                    console.log('[Custom Size] Rendering style:', ds);
                    ds === 'INLINE' ? rI(s) : rM(s, cd)
                } else {
                    console.log('[Custom Size] No sets matched for handles:', v);
                    cs = null;
                    if (document.getElementById('cs-inline') || document.getElementById('cs-modal')) {
                        cM();
                        rmI();
                        tB(1);
                    }
                }
            } catch (e) {
                console.error('[Custom Size] Error in cV:', e);
            }
        };

        const aD = d => {
            let s = document.getElementById('cs-design') || document.createElement('style');
            s.id = 'cs-design';
            if (!s.parentNode) document.head.appendChild(s);
            const r = [
                d.modalBgColor && `.custom-size-modal,.custom-size-inline{background-color:${d.modalBgColor}!important;}`,
                d.textColor && `.custom-size-input{color:${d.textColor}!important;}`,
                d.borderColor && `.custom-size-input{border-color:${d.borderColor}!important;}`,
                d.borderWidth != null && `.custom-size-input{border-width:${d.borderWidth}px!important;}`,
                d.borderStyle && `.custom-size-input{border-style:${d.borderStyle}!important;}`,
                d.placeholderColor && `.custom-size-input::placeholder{color:${d.placeholderColor}!important;}`,
                d.titleColor && `.custom-size-header h2,.custom-size-set-section h3,.custom-size-set-block h3{color:${d.titleColor}!important;}`,
                (d.noteColor || d.noteBgColor) && `.custom-size-note{${d.noteColor ? 'color:' + d.noteColor + '!important;' : ''}${d.noteBgColor ? 'background-color:' + d.noteBgColor + '!important;' : ''}}`,
                d.noteTitleFontSizeDesktop && `.custom-size-note h3{font-size:${d.noteTitleFontSizeDesktop}!important;}`,
                d.noteContentFontSizeDesktop && `.custom-size-note p{font-size:${d.noteContentFontSizeDesktop}!important;}`,
                d.fieldTitleFontSizeDesktop && `.custom-size-field label{font-size:${d.fieldTitleFontSizeDesktop}!important;}`,
                d.fieldPlaceholderFontSizeDesktop && `.custom-size-input{font-size:${d.fieldPlaceholderFontSizeDesktop}!important;}`,
                `@media screen and (max-width:600px){`,
                d.noteTitleFontSizeMobile && `.custom-size-note h3{font-size:${d.noteTitleFontSizeMobile}!important;}`,
                d.noteContentFontSizeMobile && `.custom-size-note p{font-size:${d.noteContentFontSizeMobile}!important;}`,
                d.fieldTitleFontSizeMobile && `.custom-size-field label{font-size:${d.fieldTitleFontSizeMobile}!important;}`,
                d.fieldPlaceholderFontSizeMobile && `.custom-size-input{font-size:${d.fieldPlaceholderFontSizeMobile}!important;}`,
                `}`,
                d.customCss
            ].filter(Boolean).join('');
            s.innerHTML = r;
        };

        const tB = e => {
            const { add: a, buy: b } = getB();
            [a, b].forEach(t => {
                if (t) {
                    t.disabled = !e;
                    t.style.opacity = e ? '1' : '0.4';
                    t.style.cursor = e ? 'pointer' : 'not-allowed';
                    t.style.pointerEvents = e ? 'auto' : 'none';
                    t.style.filter = e ? 'none' : 'grayscale(1)';
                    if (!e) t.setAttribute('aria-disabled', 'true');
                    else t.removeAttribute('aria-disabled');
                }
            })
        };

        const vI = s => {
            const r = [...s.querySelectorAll('.custom-size-input')];
            tB(r.every(i => i.value.trim() !== ''))
        };

        const sN = i => {
            i.addEventListener('keypress', e => {
                if (!/[0-9.]/.test(e.key)) e.preventDefault();
            });
            i.addEventListener('paste', e => {
                const c = (e.clipboardData || window.clipboardData).getData('text');
                if (isNaN(parseFloat(c)) && !/^[0-9.]+$/.test(c)) e.preventDefault();
            });
        };

        const rI = s => {
            rmI();
            tB(0);
            const d = document.createElement('div');
            d.id = 'cs-inline';
            d.className = 'custom-size-inline';
            d.style.margin = '15px 0';
            d.innerHTML = s.map(t => `<div class="custom-size-set-block">${bH(t)}</div>`).join('<hr style="margin:15px 0;border:0;border-top:1px solid #eee;"/>');

            if (ctBlock) {
                ctBlock.appendChild(d);
            } else {
                const f = getF();
                if (f) {
                    const v = f.querySelectorAll('variant-radios, variant-selects, .product-form__input, .product-variant-picker');
                    if (v.length) {
                        v[v.length - 1].after(d)
                    } else {
                        const b = f.querySelector('.product-form__buttons,.shopify-payment-button,[name="add"]');
                        (b?.closest('.product-form__buttons') || b || f).before(d)
                    }
                }
            }

            const f = getF();
            if (f) {
                f.addEventListener('submit', (e) => {
                    const r = [...d.querySelectorAll('.custom-size-input')];
                    if (!r.every(i => i.value.trim() !== '')) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        alert('Please fill in all fields before adding to cart');
                    } else {
                        const currentDs = cd?.displayStyle || cs?.[0]?.displayStyle;
                        if (currentDs === 'INLINE') aI(d);
                    }
                }, true)
            }

            d.querySelectorAll('.custom-size-input').forEach(i => {
                sN(i);
                i.addEventListener('input', () => vI(d));
            });
            vI(d)
        };

        const rmI = () => document.getElementById('cs-inline')?.remove();

        const rM = (s, d) => {
            if (document.getElementById('cs-modal')) return;
            tB(0);
            const o = document.createElement('div');
            o.id = 'cs-modal';
            o.className = 'custom-size-modal-overlay';
            const h = s.some(t => t.imagePosition === 'left' || t.imagePosition === 'right') || cd?.imageLayout === 'horizontal';
            o.innerHTML = `<div class="custom-size-modal ${h ? 'custom-size-modal-wide' : ''}"><div class="custom-size-header"><h2>Custom Size</h2><button class="custom-size-close">&times;</button></div><div class="custom-size-body">${s.map(t => `<div class="custom-size-set-section"><h3 style="margin-bottom:15px;font-size:1.1em;">${t.name}</h3>${bSC(t)}</div>`).join('<hr style="margin:15px 0;border:0;border-top:1px solid #eee;"/>')}</div><div class="custom-size-footer"><button class="custom-size-save-btn">Save Measurements</button></div></div>`;
            document.body.appendChild(o);
            const i = o.querySelectorAll('.custom-size-input');
            i.forEach(t => {
                sN(t);
                t.addEventListener('input', () => vI(o));
            });
            vI(o);
            o.querySelector('.custom-size-close').addEventListener('click', () => {
                cM();
                rT(s)
            });
            o.querySelector('.custom-size-save-btn').addEventListener('click', e => {
                e.preventDefault();
                const n = [...i].filter(t => !t.value.trim());
                if (n.length) {
                    n.forEach(t => t.classList.add('error'));
                    alert('Please fill in all fields');
                    return
                }
                aI(o);
                cM();
                tB(1);
                rT(s, true)
            })
        };

        const rT = (s, v) => {
            rmI();
            const d = document.createElement('div');
            d.id = 'cs-inline';
            d.className = 'custom-size-inline';
            const b = document.createElement('button');
            b.className = 'custom-size-trigger-btn';
            b.innerText = v ? 'Edit Measurements' : 'Open Custom Size Form';
            b.style.cssText = 'padding:10px 20px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin:10px 0;width:100%;';
            b.onclick = (e) => {
                e.preventDefault();
                rM(s, cd)
            };
            d.appendChild(b);

            if (ctBlock) {
                ctBlock.appendChild(d);
            } else {
                const f = getF();
                if (f) {
                    const vS = f.querySelectorAll('variant-radios, variant-selects, .product-form__input, .product-variant-picker');
                    if (vS.length) {
                        vS[vS.length - 1].after(d)
                    } else {
                        const b = f.querySelector('.product-form__buttons,.shopify-payment-button,[name="add"]');
                        (b?.closest('.product-form__buttons') || b || f).before(d)
                    }
                }
            }
        };

        const cM = () => document.getElementById('cs-modal')?.remove();

        const aI = c => {
            const f = getF();
            if (!f) return;
            f.querySelectorAll('.cs-hidden').forEach(e => e.remove());
            c.querySelectorAll('input,select').forEach(i => {
                if (i.value) {
                    const h = document.createElement('input');
                    h.type = 'hidden';
                    h.name = i.name;
                    h.value = i.value;
                    h.className = 'cs-hidden';
                    f.appendChild(h)
                }
            })
        };

        const bSC = s => {
            const m = window.innerWidth <= 600,
                p = m ? (s.mobileImagePosition || 'top') : s.imagePosition,
                iW = m ? s.mobileImageWidth : s.imageWidth,
                iH = m ? s.mobileImageHeight : s.imageHeight,
                iCW = m ? s.mobileImageContainerWidth : s.imageContainerWidth,
                fCW = m ? s.mobileFieldsContainerWidth : s.fieldsContainerWidth,
                iS = `width:${iW || 'auto'};height:${iH || 'auto'};object-fit:contain;max-width:100%;`,
                iCS = iCW ? `flex:0 0 ${iCW};max-width:${iCW};` : '',
                fCS = fCW ? `flex:0 0 ${fCW};max-width:${fCW};` : '',
                iHtml = s.imageUrl ? `<div class="custom-size-image-container" style="${iCS}"><img src="${s.imageUrl}" alt="${s.name}" style="${iS}"/></div>` : '',
                fHtml = `<div class="custom-size-fields-wrapper" style="${fCS}"><div class="custom-size-fields">${bNS(s)}${s.fields.map(f => `<div class="custom-size-field"><label>${f.label}${f.required ? '*' : ''}</label><input type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*" name="properties[${f.label}]" ${f.required ? 'required' : ''} class="custom-size-input" placeholder="${f.placeholder || 'IN INCHES'}"/></div>`).join('')}</div></div>`;
            const rev = p === 'bottom' || p === 'right';
            return `${bNH(s)}<div class="custom-size-set-layout custom-size-layout-${p}">${rev ? fHtml + iHtml : iHtml + fHtml}</div>`
        };

        const bH = s => `<div class="custom-size-set-block"><h3 style="margin-bottom:15px;font-size:1.1em;">${s.name}</h3>${bSC(s)}</div>`;

        const bNH = s => {
            if (!s.noteTitle && !s.noteContent) return '';
            let contentHtml = '';
            if (s.noteContent) {
                const lines = s.noteContent.split('\n').filter(l => l.trim());
                contentHtml = `<ul style="margin:0;padding-left:20px;list-style-type:disc;">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
            }
            return `<div class="custom-size-note">${s.noteTitle ? `<h3>${s.noteTitle}</h3>` : ''}${contentHtml}</div>`;
        };

        const bNS = s => {
            if (!s.reqNearestSize) return '';
            const f = getF(),
                o = [...f ? f.querySelectorAll('select[name*="Size"] option,input[name*="Size"]') : []]
                    .map(e => e.value || e.innerText)
                    .filter(v => v && !v.toLowerCase().includes('custom'));

            if (!o.length) return '';

            return `<div class="custom-size-field-swatches">
                <label>Please select one option from nearest size*</label>
                <input type="hidden" class="custom-size-nearest-size-input custom-size-input" name="properties[Nearest Size]" required />
                <div class="custom-size-swatches">
                    ${o.map(t => `<button type="button" class="custom-size-swatch" data-value="${t}">${t}</button>`).join('')}
                </div>
            </div>`;
        };

        const debouncedCV = () => {
            clearTimeout(window.csTimeout);
            window.csTimeout = setTimeout(cV, 50);
        };

        cV();
        document.addEventListener('change', e => {
            if (e.target.matches('input[type="radio"],select,option,input[name*="option"]')) debouncedCV();
        });
        // Catch clicks on labels/buttons that theme uses for swatches
        document.addEventListener('click', e => {
            if (e.target.closest('.product-form__input label, .variant-picker label, label[for^="Option"], .swatch-element')) debouncedCV();

            // Handle our own nearest size swatches
            const swatch = e.target.closest('.custom-size-swatch');
            if (swatch) {
                const container = swatch.closest('.custom-size-field-swatches');
                const input = container.querySelector('.custom-size-nearest-size-input');
                const swatches = container.querySelectorAll('.custom-size-swatch');

                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                input.value = swatch.dataset.value;

                // Trigger validation check
                const modal = swatch.closest('.custom-size-modal-overlay') || swatch.closest('.custom-size-inline');
                if (modal) vI(modal);
            }
        });
        setInterval(cV, 2000);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});
