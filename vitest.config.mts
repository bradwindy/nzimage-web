import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// See https://nextjs.org/docs/app/guides/testing/vitest. `resolve.tsconfigPaths` resolves the
// `@/*` alias from tsconfig.json natively (Vite 7+); `react` lets us render client components
// with React Testing Library.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // window.localStorage is a single MemoryStorage instance shared across every test in a file
    // (see vitest.setup.ts); restoreMocks undoes any vi.spyOn(window.localStorage, ...) after
    // each test so a spy in one test can't leak into the next.
    clearMocks: true,
    restoreMocks: true,
  },
});
