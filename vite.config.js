import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [],
	server: { host: '0.0.0.0', port: 8000 },
	clearScreen: false,
	build: {
		chunkSizeWarningLimit: 500,
		minify: true,
		rollupOptions: {
			output: {
				// Optimize chunk splitting
				manualChunks: {
					'phaser': ['phaser'],
					'vendor': ['canvas-confetti']
				},
				// Control output directory structure
				entryFileNames: 'js/[name]-[hash].js',
				chunkFileNames: 'js/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash][extname]'
			}
		},
		sourcemap: false,
		reportCompressedSize: true
	}
})
