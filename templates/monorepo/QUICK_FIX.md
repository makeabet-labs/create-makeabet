# 快速修復 - eventemitter3 錯誤

## 問題

刪除 .js 文件時，不小心刪除了必需的 `eventemitter3-wrapper.js` 文件，導致 Vite 構建失敗。

## 已修復

✅ 重新創建了 `apps/web/src/utils/eventemitter3-wrapper.js`  
✅ 重新創建了 `apps/web/src/utils/eventemitter3.esm.js`  
✅ 更新了 `vite.config.ts` 移除 Solana chunk 配置

## 現在執行

```bash
# 重新啟動（應該已經在運行 pnpm dev）
# 如果沒有，運行：
pnpm dev
```

服務應該會正常啟動。

## 注意

下次清理時，不要刪除 `utils` 目錄中的文件。只刪除：
- 編譯後的組件 .js 文件
- providers/*.js
- components/*.js
- wallet/*.js

但保留：
- utils/*.js（這些是必需的工具文件）
- test/*.js（測試文件）
- *.config.js（配置文件）
