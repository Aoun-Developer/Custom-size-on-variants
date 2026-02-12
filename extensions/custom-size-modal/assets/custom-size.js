document.addEventListener('DOMContentLoaded', () => {
    const ctBlock = document.getElementById('custom-size-block-container');
    const ctEmbed = document.getElementById('custom-size-modal-container');
    const ct = ctBlock || ctEmbed;

    if (!ct) return;
    const shop = ct.dataset.shop;
    let cs = null, cd = null, lc = '';

    const getF = () => document.querySelector('form[action^="/cart/add"]');
    const getB = () => {
        const f = getF();
        const fId = f?.getAttribute('id');
        // Target buttons inside the form OR linked to the form via the 'form' attribute
        let a = f?.querySelector('[name="add"],[type="submit"],button[type="submit"]');
        if (!a && fId) a = document.querySelector(`[form="${fId}"][name="add"],[form="${fId}"][type="submit"]`);
        if (!a) a = document.querySelector('.product-form__submit, .add-to-cart, #AddToCart'); // Common theme classes

        let b = document.querySelector('[name="checkout"],.shopify-payment-button__button,.shopify-payment-button [role="button"]');
        if (!b && fId) b = document.querySelector(`[form="${fId}"] .shopify-payment-button__button`);

        return { add: a, buy: b };
    };

    const h = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const cV = async () => {
        const f = getF();
        if (!f) return;
        let i = [...f.querySelectorAll('input:checked,option:checked')];
        const id = f.getAttribute('id');
        if (id) i.push(...document.querySelectorAll(`input[form="${id}"]:checked,option[form="${id}"]:checked`));
        if (!i.length) i.push(...document.querySelectorAll('variant-radios input:checked,variant-selects option:checked,.product-form__input input:checked'));
        const v = [...new Set(i.map(e => e.value || e.innerText).filter(Boolean))].map(h).sort().join(',');
        if (v === lc) return;
        lc = v;
        if (!v) return;

        try {
            let u = `/apps/custom-size/api/custom-size?shop=${shop}&variant=${encodeURIComponent(v)}`;
            let r = await fetch(u);
            if (!r.ok && r.status === 404) r = await fetch(`/api/custom-size?shop=${shop}&variant=${encodeURIComponent(v)}`);
            if (!r.ok) return;
            const d = await r.json();

            if (d.design) {
                cd = d.design;
                aD(d.design)
            }

            const s = d.sets || (d.set ? [d.set] : []);
            if (s.length) {
                cs = s;
                const ds = cd?.displayStyle || s[0].displayStyle;
                ds === 'INLINE' ? rI(s) : rM(s, cd)
            } else {
                cs = null;
                cM();
                rmI();
                tB(1)
            }
        } catch (e) { }
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
                // If the theme re-enables it, we might need a MutationObserver or similar, 
                // but let's start with aggressive CSS first.
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
                } else if (cs?.[0].displayStyle === 'INLINE') {
                    aI(d);
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

    const bNH = s => (s.noteTitle || s.noteContent) ? `<div class="custom-size-note">${s.noteTitle ? `<h3>${s.noteTitle}</h3>` : ''}${s.noteContent ? `<p>${s.noteContent.replace(/\n/g, '<br>')}</p>` : ''}</div>` : '';

    const bNS = s => {
        if (!s.reqNearestSize) return '';
        const f = getF(),
            o = [...f ? f.querySelectorAll('select[name*="Size"] option,input[name*="Size"]') : []].map(e => e.value || e.innerText).filter(v => v && !v.toLowerCase().includes('custom'));
        return o.length ? `<div class="custom-size-field"><label>Please select one option from nearest size*</label><select class="custom-size-nearest-size custom-size-input" name="properties[Nearest Size]" required><option value="">Choose your nearest size</option>${o.map(t => `<option value="${t}">${t}</option>`).join('')}</select></div>` : ''
    };

    cV();
    document.addEventListener('change', e => {
        if (e.target.matches('input[type="radio"],select,option,input[name*="option"]')) setTimeout(cV, 50)
    });
    setInterval(cV, 2000)
});
