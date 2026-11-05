// Explicit opt-in diagnostic only. This dispatches actual rendered range input
// events and is synthetic automation, never a claim of finger/drag coverage.
window.reproRangeDriver = {
    async run(containerId, requestedValues) {
        const container = document.getElementById(containerId);
        const input = container?.querySelector('input[type="range"]');
        if (!input) throw new Error('Actual rendered range input is missing');
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        const observations = [];
        for (const value of requestedValues.split(',')) {
            setter.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 350));
            observations.push({ input: value, observed: document.getElementById('observed-value')?.textContent?.trim() ?? null });
        }
        return JSON.stringify({ synthetic: true, route: location.pathname, sameElement: input.isConnected, observations });
    }
};
