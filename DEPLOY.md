# GitHub Pages 發布指南（Private Repo）

隊友只看**匯出的 HTML**（跟「HTML 合集」一樣），編輯器只在你本機用，不會上線。

## 架構

| 位置 | 內容 |
|------|------|
| 本機編輯器 | `npm run dev` 規劃戰術 |
| `tactics.json` | 發布用的戰術資料（根目錄） |
| `site/index.html` | 由 `tactics.json` 自動生成的匯出 HTML |
| GitHub Pages | 只部署 `site/` 資料夾 |

---

## 第一次設定

### 1. 發布戰術資料

1. 在編輯器按 **📡 發布線上版** → 下載 `tactics.json`
2. 放到專案根目錄（覆蓋舊檔）
3. 生成 HTML：

```bash
npm run publish
```

會產生 `site/index.html`（等同 HTML 合集匯出）。

### 2. 建立 Private GitHub Repo 並推送

若尚未登入 GitHub CLI：

```bash
gh auth login
```

初始化並推送（repo 名稱可自訂）：

```bash
git init
git add .
git commit -m "Initial commit with GitHub Pages deploy"
gh repo create cs2-tactics --private --source=. --remote=origin --push
```

### 3. 開啟 GitHub Pages

1. 到 repo **Settings → Pages**
2. **Build and deployment → Source** 選 **GitHub Actions**
3. 等第一次 workflow 跑完

隊友網址：

```text
https://<你的帳號>.github.io/cs2-tactics/
```

> Private repo 的 Pages 預設也是 private，需在 Settings → Pages 調整 **Visibility** 讓隊友能看（或把隊友加為 repo collaborator）。

---

## 之後更新戰術

1. 編輯器改好 → **📡 發布線上版** → 下載新 `tactics.json`
2. 放到專案根目錄
3. 執行：

```bash
npm run publish
git add tactics.json site/index.html
git commit -m "Update tactics"
git push
```

Push 後 GitHub Actions 會自動更新線上 HTML，**網址不變**。

---

## 本機預覽

```bash
npm run publish
open site/index.html
```

---

## 常見問題

**Q: 線上會看到編輯器嗎？**  
不會。GitHub Pages 只部署 `site/index.html`。

**Q: 跟直接傳 HTML 檔有什麼分別？**  
內容一樣，但隊友只需 bookmark 固定網址，你 push 更新即可。

**Q: Private repo 隊友怎麼看？**  
方案一：Pages 設為 public（repo 仍 private，內容公開）。  
方案二：把隊友加為 GitHub collaborator。
