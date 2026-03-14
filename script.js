// 請填入你的 Notion 設定
const NOTION_TOKEN = 'ntn_o62070106085aj5mN6o0wEzDsWlU6ptnkrY9WlIk56O9Jd';
const OILS_DB_ID = '322171f7773080fcad5dec83586475ff';
const LOGS_DB_ID = '322171f777308091abbbf7af4f80a75a'; // 客資資料庫 ID
const NOTION_VERSION = '2022-06-28';

// 1. 輸出前端網頁
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('涵香療癒所 🌿 專屬精油盲抽')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 2. 取得精油清單 (進階療癒版)
function getNotionOils() {
  const url = `https://api.notion.com/v1/databases/${OILS_DB_ID}/query`;
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (!data || !data.results) return [];
  
  // 建立一個小工具來安全地抓取文字
  const getText = (props, colName) => {
    if (props[colName] && props[colName].rich_text && props[colName].rich_text.length > 0) {
      return props[colName].rich_text[0].plain_text;
    }
    return ''; // 如果沒填寫，回傳空白
  };

  return data.results.map(page => {
    const props = page.properties;
    const nameData = props['name']?.title;
    
    return {
      name: (nameData && nameData.length > 0) ? nameData[0].plain_text : '未知精油',
      quote: getText(props, 'quote') || '「傾聽內心的聲音，給自己一點時間。」',
      energy: getText(props, 'energy') || '精油正在與你的能量共振，請深呼吸感受它。',
      action: getText(props, 'action') || '將注意力帶回當下，給自己一個擁抱。',
      affirmation: getText(props, 'affirmation') || '我允許自己以最舒服的節奏前進。'
    };
  });
}

// 將客戶資料(LINE暱稱)寫入個案紀錄
function saveToNotion(userName, drawnOil) {
  const url = `https://api.notion.com/v1/pages`;
  const payload = {
    parent: { database_id: LOGS_DB_ID },
    properties: {
      // 這裡的名稱必須跟 Notion 資料庫完全一模一樣！
      "客戶姓名 / 暱稱": { title: [{ text: { content: userName || "匿名個案" } }] },
      "聯絡方式 (LINE/IG)": { rich_text: [{ text: { content: "LINE 官方帳號互動" } }] },
      "客群狀態": { select: { name: "盲抽新客" } },
      "抽中精油": { rich_text: [{ text: { content: drawnOil } }] }
    }
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
  return true;
}

