// 第二段：引入并初始化 Supabase 客户端库
// 在实际项目中，建议通过 npm install @supabase/supabase-js 安装后使用 import 语法
// const { createClient } = require('@supabase/supabase-js'); 

// 从环境变量或安全配置中获取你的 Supabase URL 和 API Key
const SUPABASE_URL = 'https://xdyfxuhlalwihohzffcr.supabase.co

'; 
const SUPABASE_ANON_KEY = 'sb_publishable_Yj-KNZPLi4mPgiAduODQ-A_2WDYQxdg'; 

// 创建 Supabase 客户端实例
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 核心数据获取函数
 */
async function fetchData() {
    statusText.textContent = '正在请求 Supabase 后端...';
    
    try {
        // 示例：从名为 'messages' 的表中查询最新的数据
        const { data, error } = await supabase
            .from('messages')       // 替换为你实际的表名
            .select('*')            // 查询所有字段
            .order('created_at', { ascending: false }) // 按时间倒序排列
            .limit(10);             // 限制返回条数

        if (error) throw error;     // 如果发生错误则抛出异常

        console.log('成功获取到数据:', data);
        statusText.textContent = `✅ 成功加载 ${data.length} 条数据！`;
        
        // TODO: 下一步将在这里渲染列表内容
    } catch (err) {
        console.error('获取数据失败:', err.message);
        statusText.textContent = '❌ 数据库请求失败: ' + err.message;
    }
}
// 第三段：完善前端逻辑，将获取到的数据动态渲染到页面上

/**
 * 核心数据获取并渲染函数
 */
async function fetchData() {
    const statusText = document.getElementById('status-text');
    const card = document.querySelector('.card'); // 获取卡片容器用于追加列表
    
    statusText.textContent = '正在请求 Supabase 后端...';
    
    try {
        // 从 'messages' 表中查询最新的数据
        const { data, error } = await supabase
            .from('messages')       
            .select('*')            
            .order('created_at', { ascending: false }) 
            .limit(10);             

        if (error) throw error;     

        // 更新状态提示
        statusText.textContent = `✅ 成功加载 ${data.length} 条数据！`;
        
        // 如果之前有渲染过列表，先清空旧内容
        const oldList = document.getElementById('data-list');
        if (oldList) oldList.remove();

        // 创建列表元素并遍历渲染数据
        if (data.length > 0) {
            const ul = document.createElement('ul');
            ul.id = 'data-list';
            ul.style.textAlign = 'left';
            ul.style.marginTop = '1rem';
            ul.style.listStyleType = 'none';
            
            data.forEach(item => {
                const li = document.createElement('li');
                li.style.padding = '0.5rem 0';
                li.style.borderBottom = '1px solid #eee';
                li.innerHTML = `<strong>${item.title || '无标题'}</strong>: ${item.content || '无内容'}`;
                ul.appendChild(li);
            });
            
            card.appendChild(ul);
        } else {
            statusText.textContent = '⚠️ 数据库中暂无数据';
        }
        
    } catch (err) {
        console.error('获取数据失败:', err.message);
        statusText.textContent = '❌ 数据库请求失败: ' + err.message;
    }
}
// 第四段：解决跨域问题并完善前后端通信配置

/**
 * 1. 创建 Supabase 客户端时，建议使用环境变量注入地址（以 Vite/React 等为例）
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co'; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-public-anon-key'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 2. Netlify 代理配置说明（需要在项目根目录创建 netlify.toml 文件）
 * 
 * [[redirects]]
 *   from = "/api/*"
 *   to = "https://your-project-url.supabase.co/rest/v1/:splat"
 *   status = 200
 *   force = true
 * 
 * 作用：将前端的 /api/ 请求透明代理到 Supabase REST API，避免浏览器跨域拦截。
 */

/**
 * 3. 核心数据获取并渲染函数（适配代理后的路径逻辑）
 */
async function fetchData() {
    const statusText = document.getElementById('status-text');
    const card = document.querySelector('.card'); 
    
    statusText.textContent = '正在请求后端数据...';
    
    try {
        // 使用 Supabase JS SDK 发起查询（SDK 会自动处理鉴权头和路径拼接）
        const { data, error } = await supabase
            .from('messages')       
            .select('*')            
            .order('created_at', { ascending: false }) 
            .limit(10);             

        if (error) throw error;     

        statusText.textContent = `✅ 成功加载 ${data.length} 条数据！`;
        
        // 清理旧列表
        const oldList = document.getElementById('data-list');
        if (oldList) oldList.remove();

        // 动态渲染新列表
        if (data.length > 0) {
            const ul = document.createElement('ul');
            ul.id = 'data-list';
            ul.style.textAlign = 'left';
            ul.style.marginTop = '1rem';
            ul.style.listStyleType = 'none';
            
            data.forEach(item => {
                const li = document.createElement('li');
                li.style.padding = '0.5rem 0';
                li.style.borderBottom = '1px solid #eee';
                li.innerHTML = `<strong>${item.title || '无标题'}</strong>: ${item.content || '无内容'}`;
                ul.appendChild(li);
            });
            
            card.appendChild(ul);
        } else {
            statusText.textContent = '⚠️ 数据库中暂无数据';
        }
        
    } catch (err) {
        console.error('获取数据失败:', err.message);
        statusText.textContent = '❌ 数据库请求失败: ' + err.message;
    }
}
