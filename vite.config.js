// vite.config.js
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite'; // Import the Tailwind CSS Vite plugin

    export default defineConfig({
      plugins: [
        react(),
        tailwindcss(), // Add the Tailwind CSS plugin to your plugins array
      ],
    });
