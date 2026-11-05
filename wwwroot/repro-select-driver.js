// Explicit opt-in app-local diagnostic. All clicks are synthetic and follow
// the real rendered MudSelect/option event pipeline; no component fields set.
window.reproSelectDriver = {
    async run(target, observer) {
        const mark = phase => observer.invokeMethodAsync("RecordSelectPhase", phase);
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        const visible = element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(element).visibility !== 'hidden'; };
        const observed = () => ({ mode: document.getElementById('probe-mode')?.textContent.trim() ?? null,
            template: document.getElementById('probe-template')?.textContent.trim() ?? null,
            role: document.getElementById('probe-role')?.textContent.trim() ?? null,
            count: Number(document.getElementById('probe-count')?.textContent ?? 0) });
        const results = [];
        const describe = () => [...document.querySelectorAll('#select-probe input, #select-probe [role], #select-probe label')]
            .map(e => ({ tag: e.tagName, role: e.getAttribute('role'), cls: e.className, label: e.tagName === 'LABEL' ? e.textContent.trim() : null, type: e.type ?? null }));
        const wait = async (predicate, description) => { for (let n = 0; n < 30; n++) { if (predicate()) return; await sleep(100); } throw new Error(description + '; model=' + JSON.stringify(observed()) + '; controls=' + JSON.stringify(describe())); };
        async function choose(label, optionText, field, expected) {
            const before = observed();
            const caption = [...document.querySelectorAll('#select-probe label')].find(e => e.textContent.trim() === label);
            const control = caption?.closest('.mud-input-control');
            const click = [...(control?.querySelectorAll('[role="combobox"], .mud-select-input, .mud-input-slot, input[readonly]') ?? [])].find(visible);
            if (!click) throw new Error('Named real select trigger missing: ' + label + '; controls=' + JSON.stringify(describe()));
            await mark("before-popup-open:" + label);
            click.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, buttons: 1 }));
            click.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
            click.click();
            await wait(() => [...document.querySelectorAll('[role="option"], .mud-popover-open .mud-list-item')].some(e => visible(e)), 'Popup did not open for ' + label);
            await mark('popup-open:' + label);
            const options = [...document.querySelectorAll('[role="option"], .mud-popover-open .mud-list-item')].filter(visible);
            const option = options.find(e => e.textContent.trim() === optionText);
            if (!option) throw new Error('Named option missing: ' + optionText + '; visible=' + JSON.stringify(options.map(e => e.textContent.trim())));
            await mark("before-selection:" + label + ":" + optionText);
            option.click();
            await wait(() => observed()[field] === expected && observed().count > before.count, 'Selection did not reach .NET for ' + label);
            await mark('selection-accepted:' + label + ':' + optionText);
            results.push({ phase: 'open-and-select', label, option: optionText, before, after: observed() });
            document.getElementById('repro-rerender').click(); await sleep(120);
            if (observed()[field] !== expected) throw new Error('Rerender lost selected .NET value');
            await mark('same-instance-rerender:' + label);
        }
        if (target === 'native') {
            const element = document.getElementById('native-mode');
            const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
            setter.call(element, 'DARK'); element.dispatchEvent(new Event('change', { bubbles: true }));
            await wait(() => observed().mode === 'DARK', 'Native control did not reach .NET');
            results.push({ phase: 'native-change', after: observed() });
        } else {
            if (target === 'all' || target === 'mode') { await choose('Mode', 'Dark', 'mode', 'DARK'); await choose('Mode', 'Bright', 'mode', 'BRIGHT'); }
            if (target === 'all' || target === 'template') { await choose('Theme template', 'SYSTEM / Ocean', 'template', 'SYSTEM:22222222-2222-2222-2222-222222222222'); await choose('Theme template', 'USER / Test copy', 'template', 'USER:33333333-3333-3333-3333-333333333333'); }
            if (target === 'all' || target === 'role') { await choose('Color role', 'Secondary', 'role', 'Secondary'); await choose('Color role', 'Info', 'role', 'Info'); }
        }
        const beforeUnmount = observed();
        document.getElementById('repro-unmount').click(); await wait(() => !document.getElementById('select-probe'), 'Unmount did not remove actual controls');
        await mark('unmounted');
        results.push({ phase: 'unmounted', before: beforeUnmount });
        document.getElementById('repro-mount').click(); await wait(() => document.getElementById('select-probe') && observed().mode === (target === 'native' ? 'DARK' : 'BRIGHT') && observed().count === 0, 'Remount did not reset component state');
        await mark('remounted');
        results.push({ phase: 'remounted', after: observed() });
        if (target === 'native') {
            const element = document.getElementById('native-mode');
            Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(element, 'BRIGHT');
            element.dispatchEvent(new Event('change', { bubbles: true }));
            await wait(() => observed().mode === 'BRIGHT', 'Repeated native control did not reach .NET');
            results.push({ phase: 'native-repeat-after-remount', after: observed() });
        }
        else if (target === 'all' || target === 'mode') await choose('Mode', 'Dark', 'mode', 'DARK');
        else if (target === 'template') await choose('Theme template', 'SYSTEM / Ocean', 'template', 'SYSTEM:22222222-2222-2222-2222-222222222222');
        else if (target === 'role') await choose('Color role', 'Secondary', 'role', 'Secondary');
        return JSON.stringify({ synthetic: true, target, results, final: observed() });
    }
};
