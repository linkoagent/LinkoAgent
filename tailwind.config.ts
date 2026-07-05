import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Fredoka", "ui-rounded", "sans-serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "primary-dim": "hsl(var(--primary-dim))",
        "primary-soft": "hsl(var(--primary-soft))",
        "card-soft": "hsl(var(--card-soft))",
        star: "hsl(var(--star))",
        heart: "hsl(var(--heart))",
        faint: "hsl(var(--faint))",
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(60% 50% at 15% 0%, hsl(var(--primary) / 0.25), transparent 60%), radial-gradient(40% 40% at 100% 10%, hsl(var(--star) / 0.12), transparent 55%)",
        "brand-button": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-dim)))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
