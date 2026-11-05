# Stock selector interaction matrix

AGENT-CONTROLLED EVIDENCE

The sample's portable `MudSelect647Probe.razor` remains byte-identical to the
Blade647-shape probe (SHA256 `a0744c8ceebb3b1b66469ab2cc5c057fe7b034de389a7d95e32be34e48dfcda6`).
The wrapper adds observations; the probe's markup, string state, generated item
fragments and ValueChanged callbacks are unchanged.

| Case | Full-AOT | all,-MudBlazor |
|---|---|---|
| Mode: static Bright/Dark items | pass,3 choices | pass,3 choices |
| Template: generated SYSTEM/USER items | pass,3 choices | pass,3 choices |
| Color role: generated items and swatches | pass,3 choices | pass,3 choices |
| All three mounted together | pass,7 choices | pass,7 choices |
| Native HTML select control | pass,2 changes | pass,2 changes |

All10 runs completed without native exit, managed driver error or fresh matching
crash report. The stock cases cover32 actual popup openings and selections,
32 explicit same-instance rerenders with preserved values, then unmount/remount
and repeated selection. The native control contributes4 confirmed changes.
Rendered .NET fields and callback counters were checked, rather than only DOM
labels. Each run has separate before-popup, popup-open, before-selection,
accepted-selection, rerender, unmount and remount checkpoints.

These are **app-local synthetic events**, not finger/trusted input. The driver
uses visible MudSelect's normal mousedown pipeline, then the real option click
handler; no component fields are assigned. The native control uses an ordinary
change event. Reflection reads only the synthetic probe's private fields to
render its .NET observations. Default entry remains manual and unmounted.

Both isolated Debug builds used SDK10.0.402/workload10.0.402.1, iOS SDK27.1.10018,
MAUI workloadSDK10.0.110/packages10.0.120, Components.Web10.0.14 and MudBlazor9.12.0.
The iPhone14ProMax simulator ran iOS26.5. Generated modes were FULL vs INTERP;
only interpreter selection differed. Packaged native Mono identifies10.0.13.0,
build10.0.1326.50504, commit4099f83977f4d29604a9aeb971fb0a7bc1d5f699.

## Repeat

Launch normally and choose **647 selector tests**, then Run and interact manually.
Explicit synthetic launch example (on your selected simulator):

```sh
SIMCTL_CHILD_REPRO_START_PATH=/select-only-repro/all?drive=true xcrun simctl launch --terminate-running-process YOUR_SIMULATOR_UUID com.example.mudsliderhybridrepro
```

Use mode/template/role/native instead of all to isolate a case. No driver runs
without `drive=true`. Visible .NET outputs and the final JSON report remain on
the page; local repro-events.log also records phases. This runner's simulator
identity was rechecked before each install and launch.

## Limits and excluded attempts

This does not reproduce the physical647 `MudSelectContext.RegisterShadowItem`
Dictionary SIGSEGV. It is not physical Release evidence or proof that the runtime
has no bug. Generic cases coexisting in one assembly can affect AOT coverage.
The existing slider matrix remains independent: its full-AOT cases failed in
SetValueTextAsync while mixed cases completed.

An initial driver clicked a hidden input without mousedown and did not open a
popup; it is excluded. Another correctly changed the native select but expected
its parent-owned value to reset when only its DOM was remounted; that harness
expectation was corrected. Neither produced a native crash. The final matrix
above uses the corrected driver throughout.

[Machine-readable observations](select-interaction-matrix.json) retain every
synthetic value/counter and final native UUID for each policy.
