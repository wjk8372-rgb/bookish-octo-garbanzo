import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

// 替换为你的 Firebase 项目配置
// 获取方式：Firebase 控制台 → 项目设置 → 常规 → 你的应用 → SDK 设置和配置
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

let app: FirebaseApp | null = null
let db: Database | null = null

try {
  if (firebaseConfig.apiKey !== 'YOUR_API_KEY') {
    app = initializeApp(firebaseConfig)
    db = getDatabase(app)
  }
} catch (e) {
  console.warn('Firebase init failed, falling back to localStorage only', e)
}

export { app, db }
