import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Inter', system-ui, sans-serif" },
        body: { value: "'Inter', system-ui, sans-serif" },
      },
      colors: {
        brand: {
          50: { value: "#E0E7FF" },
          100: { value: "#C7D2FE" },
          200: { value: "#A5B4FC" },
          300: { value: "#818CF8" },
          400: { value: "#6366F1" },
          500: { value: "#4F46E5" }, // Primary Accent
          600: { value: "#4338CA" },
          700: { value: "#3730A3" },
          800: { value: "#312E81" },
          900: { value: "#1E1B4B" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { _light: "#F7F9FC", _dark: "#0F172A" } },
          subtle: { value: { _light: "#EDF2F7", _dark: "#1E293B" } },
          canvas: { value: { _light: "#FFFFFF", _dark: "#020617" } },
        },
        fg: {
          DEFAULT: { value: { _light: "#334155", _dark: "#E2E8F0" } }, // Slate-700 / Slate-200
          muted: { value: { _light: "#64748B", _dark: "#94A3B8" } },
        },
        border: {
          DEFAULT: { value: { _light: "#E2E8F0", _dark: "#1E293B" } },
          subtle: { value: { _light: "#F1F5F9", _dark: "#334155" } },
        },
      },
      shadows: {
        soft: {
          value: {
            _light:
              "4px 4px 12px rgba(163, 177, 198, 0.4), -4px -4px 12px rgba(255, 255, 255, 0.8)",
            _dark:
              "4px 4px 12px rgba(0, 0, 0, 0.4), -4px -4px 12px rgba(30, 41, 59, 0.3)",
          },
        },
        inner: {
          value: {
            _light:
              "inset 2px 2px 5px rgba(163, 177, 198, 0.3), inset -2px -2px 5px rgba(255, 255, 255, 0.8)",
            _dark:
              "inset 2px 2px 5px rgba(0, 0, 0, 0.4), inset -2px -2px 5px rgba(30, 41, 59, 0.3)",
          },
        },
        glass: {
          value: {
            _light: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
            _dark: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg",
      color: "fg",
      transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
    },
  },
});

export const system = createSystem(defaultConfig, config);
