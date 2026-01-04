import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [preact()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/export.js'),
            name: 'NNDemonstrator',
            fileName: 'nn-demonstrator',
            formats: ['es', 'umd']
        },
        rollupOptions: {
            // Preact is now bundled!
        },
        outDir: 'dist-lib',
        emptyOutDir: true
    }
})
