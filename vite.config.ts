import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', // Set the source directory as the root
  build: {
    outDir: '../dist', // Output build files to a 'dist' directory at the project root
    emptyOutDir: true, // Empty the output directory on build
  },
  server: {
    open: true, // Automatically open the browser on server start
  }
});
