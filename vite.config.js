import { defineConfig } from 'vite'  
// https://vitejs.dev/config/ 
export default defineConfig(
    {  
        base: './',
        build: {
            target: 'es2022', // 或 'es2022'
            rollupOptions: {
                output: {
                    format: 'es'
                }
            }
        }
    }
)