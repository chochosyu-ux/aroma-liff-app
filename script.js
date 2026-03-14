// ⚠️ 第一步：請將這裡換成你剛剛在 GAS 重新部署後，拿到的「最新網頁應用程式網址」！
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwwPZYPgWmD1-xRoVP8FE06kjzOuiyFNYC3JEpZZPOz1aOJGo31jl-cTxMirHXYmT4igw/exec";

// 存放客戶的 LINE 暱稱
let currentUserName = "匿名個案"; 
let oilsList = []; // 存放從 Notion 抓下來的精油清單

// 1. 初始化 LINE LIFF
async function initializeLiff() {
  try {
    // ⚠️ 記得替換成你真實的 LIFF ID
    await liff.init({ liffId: "2009442731-uAtwWSRT" }); 
    
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      currentUserName = profile.displayName; // 成功抓到 LINE 暱稱！
      console.log("登入成功，客戶暱稱：", currentUserName);
    } else {
      // 如果是在外部瀏覽器打開，可以引導登入
      // liff.login(); 
      console.log("未登入 LINE");
    }
    
    // 初始化成功後，開始去後端抓精油資料
    await fetchOilsData();

  } catch (error) {
    console.error("LIFF 初始化失敗:", error);
    // 這裡是你原本寫的防呆訊息
    // document.getElementById('greetingText').innerText = "系統連線異常，請稍後再試"; 
  }
}

// 2. 向 GAS 請求精油清單 (取代原本的 google.script.run.getNotionOils)
async function fetchOilsData() {
  try {
    console.log("正在向 GAS 獲取精油資料...");
    
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      redirect: "follow", // GAS API 必須加這行處理轉址
      body: JSON.stringify({ action: "getOils" }) // 告訴 GAS 我們要抓資料
    });

    const result = await response.json();
    
    if (result.status === "success") {
      oilsList = result.data;
      console.log("成功取得精油清單！", oilsList);
      // 👉 這裡可以寫：隱藏載入動畫、顯示「開始盲抽」按鈕的邏輯
      
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("獲取資料失敗:", error);
  }
}

// 3. 執行盲抽，並將結果存回 Notion (取代原本的 google.script.run.saveToNotion)
async function drawOilAndSave() {
  if (oilsList.length === 0) {
    alert("精油資料還沒準備好，請稍等一下喔！");
    return;
  }

  // 隨機抽出一支精油
  const randomIndex = Math.floor(Math.random() * oilsList.length);
  const drawnOil = oilsList[randomIndex];
  
  // 👉 這裡可以寫：把抽中結果 (drawnOil.name, drawnOil.quote) 顯示在畫面上的邏輯
  console.log(`恭喜！${currentUserName} 抽中了：${drawnOil.name}`);

  // 背景將紀錄傳送給 GAS 存入 Notion
  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      redirect: "follow",
      body: JSON.stringify({ 
        action: "saveRecord", 
        userName: currentUserName, 
        drawnOil: drawnOil.name 
      })
    });

    const result = await response.json();
    if (result.status === "success") {
      console.log("🎉 個案紀錄已成功無縫寫入 Notion！");
    } else {
      console.error("寫入 Notion 失敗:", result.message);
    }
  } catch (error) {
    console.error("傳送存檔請求失敗:", error);
  }
}

// 網頁載入完成後，啟動 LIFF
document.addEventListener("DOMContentLoaded", () => {
  initializeLiff();
  
  // 假設你有一個 id 叫 drawButton 的按鈕
  // document.getElementById('drawButton').addEventListener('click', drawOilAndSave);
});
