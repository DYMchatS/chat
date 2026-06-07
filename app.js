// app.js - 第 1 小段：核心连接与初始化
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ 请替换为你自己的 Supabase URL 和 Key
const SUPABASE_URL = 'https://xdyfxuhlalwihohzffcr.supabase.co

'; 
const SUPABASE_KEY = 'sb_publishable_Yj-KNZPLi4mPgiAduODQ-A_2WDYQxdg'; 
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 获取或生成当前用户的随机昵称
let currentUser = localStorage.getItem('chat_username');
if (!currentUser) {
    currentUser = 'User_' + Math.floor(Math.random() * 10000);
    localStorage.setItem('chat_username', currentUser);
}

// 导出给其他模块使用
export { currentUser };
// app.js - 第 2 小段：消息处理与UI更新
import { supabase, currentUser } from './app.js'; // 注意：实际使用时请根据文件结构调整导入路径

// DOM 元素引用
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernameDisplay = document.getElementById('username-display');

// 显示当前用户名
usernameDisplay.textContent = currentUser;

// 防 XSS 攻击的简单转义
function escapeHtml(text) { 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

// 渲染单条消息到界面
function renderMessage(msg) {
    const isMe = msg.username === currentUser;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'message-me' : 'message-other'}`;
    
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = `
        <div class="message-header">
            <span class="message-user">${msg.username}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
    `;
    
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 发送消息函数
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    
    try {
        await supabase.from('messages').insert([{ 
            content: content, 
            username: currentUser, 
            created_at: new Date().toISOString() 
        }]);
        messageInput.value = '';
    } catch (err) { 
        console.error('发送失败:', err); 
    }
}

// 加载历史消息
async function loadMessages() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);
            
        if (error) throw error;
        
        chatContainer.innerHTML = ''; 
        data.forEach(renderMessage);
    } catch (err) { 
        console.error('加载历史消息失败:', err); 
    }
}

// 监听实时消息
function subscribeToMessages() {
    supabase.channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => { 
            renderMessage(payload.new); 
        })
        .subscribe();
}

// 事件绑定
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter') sendMessage(); 
});

// 启动
loadMessages();
subscribeToMessages();
// app.js - 第 3 小段：增强功能与启动初始化

// 更新在线用户列表显示
export function updateOnlineUsers(users) {
    const userListEl = document.getElementById('user-list');
    if (users && users.length > 0) {
        userListEl.textContent = users.join(', ');
    } else {
        userListEl.textContent = '暂无在线用户';
    }
}

// 显示系统消息（如用户加入/离开聊天室）
export function showSystemMessage(text) {
    const chatContainer = document.getElementById('chat-container');
    const sysDiv = document.createElement('div');
    sysDiv.style.cssText = 'text-align: center; font-size: 12px; color: #999; padding: 5px 0;';
    sysDiv.textContent = `[系统] ${text}`;
    chatContainer.appendChild(sysDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 页面加载完成后的初始化操作
window.addEventListener('DOMContentLoaded', () => {
    // 显示欢迎回来的系统消息
    showSystemMessage(`欢迎回来，${currentUser}！`);
    
    // 初始化为空的用户列表（后续可通过 Supabase 实时更新）
    updateOnlineUsers([]); 
    
    console.log('🚀聊天室大脑 (app.js) 已完全启动！');
});
