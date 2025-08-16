
import { MANIFEST_PATH } from './__internal__/constants'

// apps/web/plugins/vite/manifest-inject-plugin.ts
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export function manifestInjectPlugin(): Plugin {
  function getManifestContent(): string {
    try {
      // 第一步：读取初始 manifest 路径文件
      const manifestPathFile = readFileSync(MANIFEST_PATH, 'utf-8').trim()
      
      // 第二步：解析实际 manifest 路径
      const actualManifestPath = path.resolve(
        path.dirname(MANIFEST_PATH), // 基于初始文件的目录
        manifestPathFile // 相对路径内容
      )
      
      // 调试日志
      console.log('[manifest-inject] Resolved manifest path:', actualManifestPath)
      
      if (!existsSync(actualManifestPath)) {
        console.warn('[manifest-inject] Actual manifest file not found:', actualManifestPath)
        return '{}'
      }
      
      // 第三步：读取实际 manifest 内容
      const content = readFileSync(actualManifestPath, 'utf-8')
      
      // 验证JSON格式
      JSON.parse(content)
      return content
    } catch (error) {
      console.warn('[manifest-inject] Failed to read manifest:', error)
      return '{}'
    }
  }

  return {
    name: 'manifest-inject',

    configureServer(server) {
      // 监听初始 manifest 路径文件变化
      server.watcher.add(MANIFEST_PATH)

      server.watcher.on('change', (file) => {
        if (file === MANIFEST_PATH) {
          console.info(
            '[manifest-inject] Manifest path file changed, triggering HMR...'
          )
          // 触发全量刷新
          server.ws.send({
            type: 'full-reload',
            path: '*'
          })
        }
      })

      // 尝试解析并监听实际 manifest 文件
      try {
        const manifestPathFile = readFileSync(MANIFEST_PATH, 'utf-8').trim()
        const actualManifestPath = path.resolve(
          path.dirname(MANIFEST_PATH),
          manifestPathFile
        )
        
        if (existsSync(actualManifestPath)) {
          server.watcher.add(actualManifestPath)
          
          server.watcher.on('change', (file) => {
            if (file === actualManifestPath) {
              console.info(
                '[manifest-inject] Actual manifest file changed, triggering HMR...'
              )
              server.ws.send({
                type: 'full-reload',
                path: '*'
              })
            }
          })
        }
      } catch (error) {
        console.warn('[manifest-inject] Failed to setup watcher for actual manifest:', error)
      }
    },

    transformIndexHtml(html) {
      const manifestContent = getManifestContent()

      // 将 manifest 内容注入到 script#manifest 标签中
      const scriptContent = `window.__MANIFEST__ = ${manifestContent};`

      return html.replace(
        '<script id="manifest"></script>',
        `<script id="manifest">${scriptContent}</script>`
      )
    }
  }
}