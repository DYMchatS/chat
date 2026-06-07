// ==========================================
// 1. 核心配置与全局变量
// ==========================================
// ⚠️ 请将下面的 URL 和 KEY 替换为你自己在 Supabase 后台获取的真实数据！
const SUPABASE_URL = 'https://xdyfxuhlalwihohzffcr.supabase.co

'; 
const SUPABASE_ANON_KEY = 'sb_publishable_Yj-KNZPLi4mPgiAduODQ-A_2WDYQxdg'; 

// 初始化 Supabase 客户端
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局状态管理
let currentUser = null;      // 当前登录的用户信息
let messagesChannel = null;  // 实时消息订阅通道
let allAccounts = [];        // 缓存所有账号列表（用于权限判断）

// 获取 DOM 元素
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// ==========================================
// 2. 登录与登出功能
// ==========================================
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. 基础校验
    if (!username || !password) {
        loginError.textContent = "请输入用户名和密码";
        return;
    }

    console.log("正在尝试登录用户:", username); // 调试日志

    loginError.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "登录中...";

    try {
        // 2. 查询 users 表
        // 注意：这里假设你的数据库表名确实是 'users'
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password) // ⚠️ 警告：明文存储密码非常不安全，仅用于学习测试
            .single();

        console.log("数据库返回结果:", data, error); // 调试日志：看看到底查到了什么

        // 3. 判断结果
        if (error) {
            // 如果是 PGRST116 错误，说明没找到人（Supabase single() 找不到数据会报错）
            if (error.code === 'PGRST116') {
                throw new Error("用户名或密码错误");
            }
            throw error;
        }

        if (!data) {
            throw new Error("用户名或密码错误");
        }

        // 4. 登录成功
        console.log("登录成功，用户信息:", data);
        currentUser = data;

        // 保存登录状态到本地（可选）
        localStorage.setItem('chat_user', JSON.stringify(data));

        showChatPage(); // 切换到聊天界面

    } catch (err) {
        console.error("登录捕获异常:", err);
        loginError.textContent = err.message || "登录失败，请检查网络或数据库设置";
    } finally {
        // 5. 无论成功失败，都要恢复按钮状态
        loginBtn.disabled = false;
        loginBtn.textContent = "登录";
    }
}

}

function handleLogout() {
  // 清理状态
  currentUser = null;
  if (messagesChannel) {
    supabaseClient.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  
  // 切换回登录页
  chatPage.style.display = 'none';
  loginPage.style.display = 'flex';
  usernameInput.value = '';
  passwordInput.value = '';
  loginError.textContent = '';
}

// 绑定登录按钮事件
loginBtn.addEventListener('click', handleLogin);
// 支持回车键登录
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});
// ==========================================
// 3. 界面切换与基础交互
// ==========================================
function showChatPage() {
  loginPage.style.display = 'none';
  chatPage.style.display = 'flex';
  
  // 根据用户角色显示管理菜单
  const createUserItem = document.getElementById('createUserItem');
  const manageAccountsItem = document.getElementById('manageAccountsItem');
  
  if (currentUser.role === 'admin') {
    createUserItem.style.display = 'block';
    manageAccountsItem.style.display = 'block';
  } else {
    createUserItem.style.display = 'none';
    manageAccountsItem.style.display = 'none';
  }
}

// 设置菜单的展开与收起
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
});

// 点击页面其他地方时关闭菜单
document.addEventListener('click', () => {
  settingsMenu.style.display = 'none';
});

// 退出登录按钮绑定
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

// ==========================================
// 4. 主题切换功能
// ==========================================
const themes = {
  blue: {
    '--primary-color': '#1890ff', '--primary-hover': '#40a9ff', 
    '--message-other-bg': '#e6f4ff', '--header-bg': '#1890ff', 
    '--send-btn-bg': '#1890ff', '--send-btn-hover': '#40a9ff'
  },
  green: {
    '--primary-color': '#52c41a', '--primary-hover': '#73d13d', 
    '--message-other-bg': '#f6ffed', '--header-bg': '#52c41a', 
    '--send-btn-bg': '#52c41a', '--send-btn-hover': '#73d13d'
  },
  dark: {
    '--primary-color': '#177ddc', '--primary-hover': '#3c9ae8', 
    '--message-other-bg': '#2a2a2a', '--header-bg': '#141414', 
    '--send-btn-bg': '#177ddc', '--send-btn-hover': '#3c9ae8'
  }
};

let currentThemeIndex = 0;
const themeKeys = Object.keys(themes);

document.getElementById('toggleThemeBtn').addEventListener('click', () => {
  currentThemeIndex = (currentThemeIndex + 1) % themeKeys.length;
  const newTheme = themes[themeKeys[currentThemeIndex]];
  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(newTheme)) {
    root.style.setProperty(key, value);
  }
});

// ==========================================
// 5. 清空本地消息记录
// ==========================================
document.getElementById('clearMsgsBtn').addEventListener('click', () => {
  if(confirm('确定要清空本地的聊天记录吗？')) {
    document.getElementById('messages').innerHTML = '';
    settingsMenu.style.display = 'none';
  }
});
// ==========================================
// 6. 核心：实时消息收发与渲染
// ==========================================
const messagesContainer = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const charCount = document.getElementById('charCount');
const sendBtn = document.getElementById('sendBtn');

// 初始化并订阅实时消息通道
function subscribeToMessages() {
  // 如果已有通道则先清理
  if (messagesChannel) supabaseClient.removeChannel(messagesChannel);

  messagesChannel = supabaseClient.channel('public:messages')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'messages' }, 
      (payload) => {
        appendMessage(payload.new);
      }
    )
    .subscribe();
}

// 发送消息
async function handleSendMessage() {
  const content = msgInput.value.trim();
  if (!content || !currentUser) return;

  // 禁用按钮防止连点
  sendBtn.disabled = true;
  
  try {
    const { error } = await supabaseClient.from('messages').insert([
      { 
        user_id: currentUser.id, 
        username: currentUser.username, 
        content: content 
      }
    ]);
    
    if (error) throw error;
    
    // 发送成功后清空输入框
    msgInput.value = '';
    updateCharCount();
  } catch (err) {
    console.error('发送失败:', err.message);
  } finally {
    sendBtn.disabled = false;
    msgInput.focus();
  }
}

// 将单条消息追加到界面并自动滚动到底部
function appendMessage(msg) {
  const isMe = msg.user_id === currentUser?.id;
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isMe ? 'me' : 'other'}`;
  
  // 如果是别人的消息，显示发送者名字
  const headerHtml = !isMe ? `<span class="message-header">${msg.username}</span>` : '';
  msgDiv.innerHTML = `${headerHtml}${escapeHtml(msg.content)}`;
  
  messagesContainer.appendChild(msgDiv);
  
  // 保持滚动条在最底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 简单的防 XSS 转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 绑定发送事件
sendBtn.addEventListener('click', handleSendMessage);
msgInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// ==========================================
// 7. 输入框字数统计限制
// ==========================================
const MAX_CHARS = 10000;

function updateCharCount() {
  const len = msgInput.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  charCount.style.color = len > MAX_CHARS ? '#ff4d4f' : '#888';
}

msgInput.addEventListener('input', () => {
  updateCharCount();
  // 超过最大字数时截断
  if (msgInput.value.length > MAX_CHARS) {
    msgInput.value = msgInput.value.slice(0, MAX_CHARS);
  }
});
// ==========================================
// 8. 管理员功能：创建新账号与角色选择
// ==========================================
const createForm = document.getElementById('createForm');
const newUserInput = document.getElementById('newUser');
const newPassInput = document.getElementById('newPass');
const roleSelectContainer = document.getElementById('roleSelectContainer');
const createMsg = document.getElementById('createMsg');

// 动态生成角色单选按钮
function renderRoleOptions() {
  const roles = ['user', 'admin']; // 可根据需要增加更多角色
  roleSelectContainer.innerHTML = '<label>选择角色：</label>';
  roles.forEach(role => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="newUserRole" value="${role}" ${role === 'user' ? 'checked' : ''}> ${role}`;
    roleSelectContainer.appendChild(label);
  });
}

// 打开/关闭创建账号弹窗
document.getElementById('createUserItem').addEventListener('click', () => {
  renderRoleOptions();
  createMsg.textContent = '';
  newUserInput.value = '';
  newPassInput.value = '';
  createForm.style.display = 'flex';
});

document.getElementById('hideCreateFormBtn').addEventListener('click', () => {
  createForm.style.display = 'none';
});

// 确认创建账号
document.getElementById('confirmCreateBtn').addEventListener('click', async () => {
  const username = newUserInput.value.trim();
  const password = newPassInput.value.trim();
  const selectedRole = document.querySelector('input[name="newUserRole"]:checked')?.value;
  
  if (!username || !password) {
    createMsg.style.color = '#ff4d4f';
    createMsg.textContent = '用户名和密码不能为空';
    return;
  }

  try {
    const { error } = await supabaseClient.from('users').insert([
      { username, password, role: selectedRole }
    ]);
    
    if (error) throw error;
    
    createMsg.style.color = '#52c41a';
    createMsg.textContent = `账号 ${username} 创建成功！`;
    setTimeout(() => { createForm.style.display = 'none'; }, 1500);
  } catch (err) {
    createMsg.style.color = '#ff4d4f';
    createMsg.textContent = err.message || '创建失败';
  }
});

// ==========================================
// 9. 管理员功能：账号管理列表与删除
// ==========================================
const accountManager = document.getElementById('accountManager');
const accountList = document.getElementById('accountList');

// 获取并渲染所有账号
async function fetchAndRenderAccounts() {
  const { data, error } = await supabaseClient.from('users').select('*');
  if (error) return console.error(error);
  
  allAccounts = data; // 缓存到全局变量
  accountList.innerHTML = '';
  
  data.forEach(acc => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'account-item';
    
    // 判断是否可以删除（不能删除自己）
    const isSelf = acc.id === currentUser.id;
    const deleteBtnHtml = `<button class="delete-btn" data-id="${acc.id}" ${isSelf ? 'disabled title="不能删除自己"' : ''}>${isSelf ? '当前' : '删除'}</button>`;
    
    itemDiv.innerHTML = `
      <div>
        <div class="account-name">${escapeHtml(acc.username)}</div>
        <div class="account-role">角色: ${acc.role}</div>
      </div>
      ${deleteBtnHtml}
    `;
    accountList.appendChild(itemDiv);
  });
  
  // 绑定删除按钮事件
  document.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.getAttribute('data-id');
      if(confirm('确定要永久删除该账号吗？')) {
        await supabaseClient.from('users').delete().eq('id', userId);
        fetchAndRenderAccounts(); // 刷新列表
      }
    });
  });
}

// 打开/关闭账号管理弹窗
document.getElementById('manageAccountsItem').addEventListener('click', () => {
  fetchAndRenderAccounts();
  accountManager.style.display = 'flex';
});

document.getElementById('hideAccountManagerBtn').addEventListener('click', () => {
  accountManager.style.display = 'none';
});
// ==========================================
// 10. 初始化与历史消息加载
// ==========================================
async function loadHistoryMessages() {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50); // 每次只加载最新的50条记录

  if (error) return console.error('加载历史记录失败:', error);
  
  // 清空现有界面并重新渲染
  messagesContainer.innerHTML = '';
  data.forEach(msg => appendMessage(msg));
}

// ==========================================
// 11. 核心启动函数
// ==========================================
function initApp() {
  // 检查是否有本地保存的登录状态（可选功能）
  // 为了演示简单，这里默认每次都需要手动登录
  
  // 绑定全局事件
  updateCharCount(); // 初始化字数统计
  
  console.log('🚀 聊天室大脑已启动！');
}

// 当 DOM 完全加载完毕后执行初始化
document.addEventListener('DOMContentLoaded', initApp);
