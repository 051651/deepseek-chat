# 部署指南

## 准备工作

需要准备的账号：
1. **GitHub 账号** — 托管代码
2. **Vercel 账号** — 部署网站（用 GitHub 登录，免费）
3. **DeepSeek API Key** — 从 [platform.deepseek.com](https://platform.deepseek.com) 获取

## 部署步骤

### 第一步：上传代码到 GitHub

```bash
# 在项目目录下执行
git init
git add .
git commit -m "初始提交：DeepSeek Chat Web"
```

然后在 GitHub 创建新仓库（不要勾选 README），按提示执行：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 第二步：在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com) 并用 GitHub 登录
2. 点击 **Add New → Project**
3. 选择刚才上传的仓库
4. 在 **Environment Variables** 中添加：
   - 名称：`DEEPSEEK_API_KEY`
   - 值：你的 DeepSeek API Key
5. 点击 **Deploy**，等待一两分钟
6. 部署完成！会生成一个 `https://你的项目.vercel.app` 的网址

### 第三步：配置自定义域名（可选）

在 Vercel 项目设置 → Domains 中添加你的域名。

## 本地开发

```bash
npm run dev
# 访问 http://localhost:3000
```

## 更新代码

本地修改后：

```bash
git add .
git commit -m "描述你的修改"
git push
```

Vercel 会自动重新部署。
