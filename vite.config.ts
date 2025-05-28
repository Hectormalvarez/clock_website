import { defineConfig, loadEnv } from 'vite';
import { getConfig } from './config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_') as ImportMetaEnv;
  const config = getConfig(env.VITE_ENVIRONMENT || 'development', env);

  return {
    root: 'src', // Set the source directory as the root
    build: {
      outDir: '../dist', // Output build files to a 'dist' directory at the project root
      emptyOutDir: true, // Empty the output directory on build
    },
    server: {
      open: true, // Automatically open the browser on server start
    },
    define: {
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(config.environment),
      'import.meta.env.VITE_AWS_DOMAIN_NAME': JSON.stringify(config.aws.domainName),
      'import.meta.env.VITE_AWS_BASE_DOMAIN': JSON.stringify(config.aws.baseDomainName),
      'import.meta.env.VITE_AWS_HOSTED_ZONE_ID': JSON.stringify(config.aws.hostedZoneId),
    }
  };
});
