using System.Globalization;

namespace MudSliderHybridRepro.Components.Owned;

internal readonly record struct AppMudColorValue(byte Red, byte Green, byte Blue, byte Alpha)
{
    public string Hex => $"#{Red:X2}{Green:X2}{Blue:X2}{Alpha:X2}";

    public static bool TryParse(string? text, out AppMudColorValue color)
    {
        color = default;
        var hex = text?.Trim();
        if (hex?.StartsWith('#') == true) hex = hex[1..];
        if (hex is null || hex.Length is not (3 or 4 or 6 or 8) || !hex.All(Uri.IsHexDigit)) return false;
        if (hex.Length is 3 or 4) hex = string.Concat(hex.Select(character => new string(character, 2)));
        if (hex.Length == 6) hex += "FF";
        color = new(byte.Parse(hex.AsSpan(0, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture),
            byte.Parse(hex.AsSpan(2, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture),
            byte.Parse(hex.AsSpan(4, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture),
            byte.Parse(hex.AsSpan(6, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture));
        return true;
    }

    public (double Hue, double Saturation, double Value) ToHsv(double achromaticHue = 0)
    {
        var red = Red / 255d; var green = Green / 255d; var blue = Blue / 255d;
        var maximum = Math.Max(red, Math.Max(green, blue));
        var minimum = Math.Min(red, Math.Min(green, blue));
        var delta = maximum - minimum;
        if (delta == 0) return (HueValue(achromaticHue), 0, maximum);
        var hue = maximum == red ? 60 * ((green - blue) / delta % 6)
            : maximum == green ? 60 * ((blue - red) / delta + 2) : 60 * ((red - green) / delta + 4);
        return (HueValue(hue), maximum == 0 ? 0 : delta / maximum, maximum);
    }

    public static AppMudColorValue FromHsv(double hue, double saturation, double value, double alpha)
    {
        hue = HueValue(hue); saturation = Unit(saturation); value = Unit(value); alpha = Unit(alpha);
        var chroma = value * saturation;
        var intermediate = chroma * (1 - Math.Abs(hue / 60 % 2 - 1));
        var offset = value - chroma;
        var (red, green, blue) = hue switch
        {
            < 60 => (chroma, intermediate, 0d), < 120 => (intermediate, chroma, 0d),
            < 180 => (0d, chroma, intermediate), < 240 => (0d, intermediate, chroma),
            < 300 => (intermediate, 0d, chroma), _ => (chroma, 0d, intermediate)
        };
        static byte Channel(double number) => (byte)Math.Round(number * 255, MidpointRounding.AwayFromZero);
        return new(Channel(red + offset), Channel(green + offset), Channel(blue + offset), Channel(alpha));
    }

    private static double Unit(double number) => double.IsFinite(number) ? Math.Clamp(number, 0, 1) : 0;
    private static double HueValue(double number) => double.IsFinite(number) ? (number % 360 + 360) % 360 : 0;
}
