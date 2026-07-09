# 團隊 Gantt Chart

一個簡單的網頁工具，用來規劃 **5 位團隊成員** 的任務時間表，並匯出給隊友查看。

## 功能

- 5 位成員，可自訂名稱
- 新增 / 編輯 / 刪除任務，指定負責人與起止日期
- 視覺化 Gantt Chart（按成員分行顯示）
- 匯出格式：
  - **PNG** — 圖片，方便貼到 Slack / Teams
  - **PDF** — 正式文件
  - **HTML** — 獨立網頁，隊友用瀏覽器直接打開
  - **JSON** — 備份或與隊友交換可編輯的專案檔

資料會自動保存在瀏覽器本地（localStorage）。

## 開始使用

```bash
npm install
npm run dev
```

打開 http://localhost:5173 即可使用。

## 建置

```bash
npm run build
npm run preview
```

建置後的靜態檔案在 `dist/`，可部署到任何靜態主機。
