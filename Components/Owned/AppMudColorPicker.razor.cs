using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using FocusEventArgs = Microsoft.AspNetCore.Components.Web.FocusEventArgs;

namespace MudSliderHybridRepro.Components.Owned;

public partial class AppMudColorPicker
{
    [Parameter] public string? Value { get; set; }
    [Parameter] public EventCallback<string> ValueChanged { get; set; }
    [Parameter] public string Label { get; set; } = string.Empty;
    [Parameter] public bool Disabled { get; set; }
    private string currentHex = "#000000FF", publishedHex = "#000000FF", hexText = "#000000FF";
    private double hue, saturation, brightness, alpha = 1;
    private bool invalidHex, disposed, attaching;
    private ElementReference root;
    private DotNetObjectReference<AppMudColorPicker>? receiver;
    private IJSObjectReference? adapter;
    private readonly string hexId = "app-color-hex-" + Guid.NewGuid().ToString("N");
    private readonly string hintId = "app-color-hint-" + Guid.NewGuid().ToString("N");
    private readonly string errorId = "app-color-error-" + Guid.NewGuid().ToString("N");
    private bool Rtl => CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft;
    private static string L(string key) => key switch
    {
        "ThemeSchemeColorSv" => "Saturation and brightness",
        "ThemeSchemeColorSvKeys" => "Arrow keys adjust saturation and brightness. Shift uses larger steps.",
        "MudColorPicker_HueSlider" => "Hue (owned)",
        "MudColorPicker_AlphaSlider" => "Alpha (owned)",
        "ThemeSchemeColorHex" => "HEX",
        "ThemeSchemeColorInvalidHex" => "Enter 3, 4, 6 or 8 hexadecimal digits.",
        "ThemeSchemeColorSaturation" => "Saturation",
        "ThemeSchemeColorBrightness" => "Brightness",
        _ => throw new ArgumentOutOfRangeException(nameof(key), key, "Unknown demo label")
    };
    private static string Number(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);
    private string HueColor => AppMudColorValue.FromHsv(hue, 1, 1, 1).Hex;
    private string HueTrack => $"linear-gradient(to {(Rtl ? "left" : "right")},#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)";
    private string AlphaTrack => $"linear-gradient(to {(Rtl ? "left" : "right")},{currentHex[..7]}00,{currentHex[..7]}FF), repeating-conic-gradient(#aaa 0% 25%,#eee 0% 50%) 0/12px 12px";
    private string SvText => L("ThemeSchemeColorSaturation") + " " + Number(saturation * 100) + "%, "
        + L("ThemeSchemeColorBrightness") + " " + Number(brightness * 100) + "%";

    protected override void OnParametersSet()
    {
        if (!AppMudColorValue.TryParse(Value, out var color)) color = new(0, 0, 0, 255);
        if (color.Hex != currentHex)
        {
            currentHex = hexText = color.Hex;
            (hue, saturation, brightness) = color.ToHsv(hue);
            alpha = color.Alpha / 255d;
            invalidHex = false;
        }
        publishedHex = color.Hex;
    }

    [DynamicDependency(nameof(SetSaturationValue))]
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (disposed || adapter is not null || attaching) return;
        attaching = true;
        try
        {
            receiver ??= DotNetObjectReference.Create(this);
            var attached = await JS.InvokeAsync<IJSObjectReference>("RdsUI.AppColorPicker.attach", root, receiver);
            if (disposed) { await attached.InvokeVoidAsync("dispose"); await attached.DisposeAsync(); }
            else adapter = attached;
        }
        finally { attaching = false; }
    }

    [JSInvokable]
    public Task SetSaturationValue(double nextSaturation, double nextBrightness) => InvokeAsync(() =>
    {
        if (disposed || Disabled || !double.IsFinite(nextSaturation) || !double.IsFinite(nextBrightness)) return Task.CompletedTask;
        saturation = Math.Clamp(nextSaturation, 0, 1); brightness = Math.Clamp(nextBrightness, 0, 1);
        return Publish();
    });

    internal Task SetHue(double value)
    {
        if (disposed || Disabled || !double.IsFinite(value)) return Task.CompletedTask;
        hue = Math.Clamp(value, 0, 360); return Publish();
    }
    internal Task SetAlpha(double value)
    {
        if (disposed || Disabled || !double.IsFinite(value)) return Task.CompletedTask;
        alpha = Math.Clamp(value, 0, 255) / 255; return Publish();
    }
    internal Task SetHexText(string? text)
    {
        if (disposed || Disabled) return Task.CompletedTask;
        hexText = text ?? string.Empty;
        invalidHex = !AppMudColorValue.TryParse(hexText, out var color);
        if (invalidHex) return Task.CompletedTask;
        (hue, saturation, brightness) = color.ToHsv(hue); alpha = color.Alpha / 255d;
        return Publish(preserveHexText: true);
    }
    private void HexBlur(FocusEventArgs _) { if (!invalidHex) hexText = currentHex; }
    private Task Publish(bool preserveHexText = false)
    {
        currentHex = AppMudColorValue.FromHsv(hue, saturation, brightness, alpha).Hex;
        if (!preserveHexText) hexText = currentHex;
        invalidHex = false;
        StateHasChanged();
        if (currentHex == publishedHex) return Task.CompletedTask;
        publishedHex = currentHex;
        return ValueChanged.InvokeAsync(currentHex);
    }

    public async ValueTask DisposeAsync()
    {
        if (disposed) return;
        disposed = true;
        if (adapter is { } captured)
        {
            adapter = null;
            try { await captured.InvokeVoidAsync("dispose"); await captured.DisposeAsync(); }
            catch (Exception exception) when (exception is JSDisconnectedException or ObjectDisposedException or TaskCanceledException) { }
        }
        receiver?.Dispose();
    }
}
