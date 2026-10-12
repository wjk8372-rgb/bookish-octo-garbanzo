import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

// 替换为你的 Firebase 项目配置
// 获取方式：Firebase 控制台 → 项目设置 → 常规 → 你的应用 → SDK 设置和配置
const firebaseConfig = {
  apiKey: "AIzaSyDdsE8P59egcGfT3LEuTIBVYRFGvv4JGus",
  authDomain: "birthday-gift-1013.firebaseapp.com",
  databaseURL: "https://birthday-gift-1013-default-rtdb.firebaseio.com",
  projectId: "birthday-gift-1013",
  storageBucket: "birthday-gift-1013.appspot.com",
  messagingSenderId: "1036206397006",
  appId: "1:1036206397006:web:bf8a0e6c3d2a5b7e"
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
