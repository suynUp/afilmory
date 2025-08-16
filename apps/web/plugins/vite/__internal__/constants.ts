// apps/web/plugins/vite/__internal__/constants.ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
 
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
 
export const MANIFEST_PATH = path.resolve(
  __dirname,
  '../../../../../packages/data/src/photos-manifest.json',
)
 
export const MONOREPO_ROOT_PATH = path.resolve(__dirname, '../../../../..')