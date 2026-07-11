import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nakedeyent.oracle",
  appName: "Oracle",
  webDir: "apps/mobile/dist",
  bundledWebRuntime: false,
  ios: {
    scheme: "Oracle"
  },
  android: {
    buildOptions: {
      releaseType: "AAB"
    }
  }
};

export default config;
