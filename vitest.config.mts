import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    // Node 25+ enables the Web Storage API by default, which shadows jsdom's localStorage
    // implementation inside the worker and breaks every localStorage-backed test.
    // https://github.com/vitest-dev/vitest/issues/8757
    // Use the `--no-experimental-webstorage` spelling (not `--no-webstorage`, which Node only
    // recognizes from v25 on) so this also works unchanged on CI's pinned Node 24.
    execArgv: ["--no-experimental-webstorage"],
  },
});
