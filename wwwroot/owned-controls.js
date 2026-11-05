"use strict";
var RdsUI;
(function (RdsUI) {
    /** SV coordinates only. Native HTML ranges retain their browser input engine. */
    class AppColorPicker {
        static attach(root, receiver) {
            const plane = root.querySelector('[data-color-sv]');
            if (!plane)
                throw new Error('The App color plane is missing.');
            let disposed = false;
            let pointer = null;
            let frame = null;
            let sending = false;
            let pending = null;
            const active = () => !disposed && root.isConnected && root.dataset.colorDisabled !== 'true';
            const rtl = () => getComputedStyle(root).direction === 'rtl';
            const unit = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
            const send = () => {
                frame = null;
                if (!active()) {
                    pending = null;
                    return;
                }
                if (sending || !pending)
                    return;
                const point = pending;
                pending = null;
                sending = true;
                receiver.invokeMethodAsync('SetSaturationValue', point.s, point.v)
                    .catch(error => { if (!disposed)
                    console.error('App color input failed.', error); })
                    .finally(() => {
                    sending = false;
                    if (!active()) {
                        pending = null;
                        return;
                    }
                    if (pending && frame === null)
                        frame = requestAnimationFrame(send);
                });
            };
            const choose = (s, v) => {
                if (!active())
                    return;
                pending = { s: unit(s), v: unit(v) };
                plane.dataset.colorS = String(pending.s);
                plane.dataset.colorV = String(pending.v);
                plane.style.setProperty('--app-color-x', `${(rtl() ? 1 - pending.s : pending.s) * 100}%`);
                plane.style.setProperty('--app-color-y', `${(1 - pending.v) * 100}%`);
                if (!sending && frame === null)
                    frame = requestAnimationFrame(send);
            };
            const point = (event) => {
                const bounds = plane.getBoundingClientRect();
                if (bounds.width <= 0 || bounds.height <= 0)
                    return;
                const x = unit((event.clientX - bounds.left) / bounds.width);
                choose(rtl() ? 1 - x : x, 1 - (event.clientY - bounds.top) / bounds.height);
            };
            const down = (event) => {
                if (!active() || !event.isPrimary || event.button !== 0)
                    return;
                event.preventDefault();
                pointer = event.pointerId;
                plane.focus({ preventScroll: true });
                try {
                    plane.setPointerCapture(pointer);
                }
                catch { }
                point(event);
            };
            const move = (event) => {
                if (event.pointerId !== pointer || !active())
                    return;
                event.preventDefault();
                point(event);
            };
            const up = (event) => {
                if (event.pointerId !== pointer)
                    return;
                if (active()) {
                    event.preventDefault();
                    point(event);
                }
                pointer = null;
                try {
                    if (plane.hasPointerCapture(event.pointerId))
                        plane.releasePointerCapture(event.pointerId);
                }
                catch { }
            };
            const clear = () => {
                pending = null;
                if (frame !== null)
                    cancelAnimationFrame(frame);
                frame = null;
            };
            const cancel = (event) => {
                if (event.pointerId !== pointer)
                    return;
                pointer = null;
                clear();
            };
            const key = (event) => {
                if (!active() || event.altKey || event.ctrlKey || event.metaKey)
                    return;
                let s = pending?.s ?? Number(plane.dataset.colorS);
                let v = pending?.v ?? Number(plane.dataset.colorV);
                const step = event.shiftKey ? .1 : .01;
                if (event.key === 'ArrowLeft')
                    s += rtl() ? step : -step;
                else if (event.key === 'ArrowRight')
                    s += rtl() ? -step : step;
                else if (event.key === 'ArrowUp')
                    v += step;
                else if (event.key === 'ArrowDown')
                    v -= step;
                else if (event.key === 'Home')
                    s = 0;
                else if (event.key === 'End')
                    s = 1;
                else if (event.key === 'PageUp')
                    v += .1;
                else if (event.key === 'PageDown')
                    v -= .1;
                else
                    return;
                event.preventDefault();
                choose(s, v);
            };
            const otherInput = (event) => { if (event.target !== plane)
                clear(); };
            plane.addEventListener('pointerdown', down);
            plane.addEventListener('pointermove', move);
            plane.addEventListener('pointerup', up);
            plane.addEventListener('pointercancel', cancel);
            plane.addEventListener('lostpointercapture', cancel);
            plane.addEventListener('keydown', key);
            root.addEventListener('input', otherInput, true);
            return { dispose() {
                    if (disposed)
                        return;
                    disposed = true;
                    clear();
                    if (pointer !== null) {
                        try {
                            plane.releasePointerCapture(pointer);
                        }
                        catch { }
                    }
                    pointer = null;
                    plane.removeEventListener('pointerdown', down);
                    plane.removeEventListener('pointermove', move);
                    plane.removeEventListener('pointerup', up);
                    plane.removeEventListener('pointercancel', cancel);
                    plane.removeEventListener('lostpointercapture', cancel);
                    plane.removeEventListener('keydown', key);
                    root.removeEventListener('input', otherInput, true);
                } };
        }
    }
    RdsUI.AppColorPicker = AppColorPicker;
})(RdsUI || (RdsUI = {}));
