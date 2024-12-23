declare module 'iro' {
    interface Color {
        hexString: string;
    }

    interface ColorPickerOptions {
        width: number;
        color: string;
    }

    interface ColorPicker {
        on(event: 'color:change', callback: (color: Color) => void): void;
    }

    const ColorPicker: {
        new (element: string, options: ColorPickerOptions): ColorPicker;
    };
}