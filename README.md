# pg-popshot

夜市風**射氣球**：彩球陣、飛鏢射擊、連擊加分、金氣球加碼。純前端，無建置步驟。

名稱與節奏為原創小品，致敬「夜市射氣球／鏢射彩球」玩法類型，非任一商業作品復刻。

也可當作 [Playgrounds（遊樂場）](https://play.samkuo.me/) 的 **SAM**（`index.html` 入口）。手感想再調？開進來玩，再叫 AI 幫你改一版。

## 一鍵開 SAM 小

**[一鍵開 SAM 小](https://play.samkuo.me/?open=sampot%2Fpg-popshot&name=%E5%B0%84%E6%B0%A3%E7%90%83)**

```
https://play.samkuo.me/?open=sampot/pg-popshot&name=射氣球
```

同源會重用本機已匯入的沙盒；要強制新建可加 `&fresh=1`。

## 試玩（本機）

```bash
npx --yes serve .
# 或
python3 -m http.server 8080
```

點一下頁面後音效才會出聲。

## 操作

| 操作 | 說明 |
| --- | --- |
| 點擊／觸控 | 瞄準並射出飛鏢 |
| 開台 | 開始一局（20 鏢／30 秒） |
| 音效開／關 | 靜音 |
| 重來 | 分數歸零 |

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 結構 |
| `styles.css` | 亮／暗色主題 |
| `app.js` | Canvas、輸入、HUD |
| `game.js` | 氣球陣、飛鏢、計分、連擊 |
| `sprites.js` | 攤位、氣球、飛鏢繪製 |
| `audio.js` | Web Audio 合成音效 |
| `functions.js` | Playgrounds 可選 stub |

## License

MIT
