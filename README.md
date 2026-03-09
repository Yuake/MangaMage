# MangaMage

**MangaMage 漫法魔书** 是一款由 React (Vite) 和 Python (FastAPI) 驱动的现代化智能漫画与小说翻译工具。它利用 Google Gemini 大语言模型进行高精度的文本识别 (OCR) 与多语言翻译，并结合强大的机器视觉技术 (OpenCV) 实现真正的“嵌字级”漫画翻译替换。

## ✨ 核心功能

1. **漫画/图片智能翻译与嵌字 (Image Translation & Inpainting)**
   * **精准 OCR**：使用 Gemini 2.5 Flash 自动检测并提取漫画对话框内的文本，智能忽略背景音效字或无用边缘笔记。
   * **无损擦除 (Smart Erasing)**：后端采用 OpenCV 自适应阈值算法，**仅擦除深色的文字线条**，完美保留原图的对话框气泡框和背景画面，不破坏原画质感。
   * **自动重绘 (Auto Text Rendering)**：使用 Pillow 自动计算目标语言的最佳字号与换行排版，将翻译后的文字无缝渲染回图片中原对话框的位置。
2. **纯文本直译 (Raw Text Translation)**
   * 支持直接粘贴小说或其它生肉文本，在保持原有语气、排版和语境的情况下进行高质量的长文本翻译。
3. **多语言支持**
   * 支持翻译至：简体中文、繁体中文、英语、日语、韩语、西班牙语、法语等主流语言。
4. **现代化 UI 界面**
   * 提供美观、流畅且响应式的用户体验，支持中英双语界面一键切换。

---

## 🛠️ 技术栈

* **前端**: React 19, Vite, TailwindCSS (v4), Lucide Icons, React Markdown
* **后端**: Python 3, FastAPI, OpenCV (`cv2`), Pillow, Google GenAI SDK (`@google/genai`)
* **AI 模型**: Google Gemini 2.5 Flash

---

## 🚀 快速开始与安装使用

项目分为前端 (React) 和后端 (Python FastAPI) 两部分，需要分别安装依赖并启动服务。

### 0. 准备工作

* 确保您的电脑上已安装好 [Node.js](https://nodejs.org/) (用于前端) 和 [Python 3.10+](https://www.python.org/downloads/) (用于后端)。
* 申请一个免费的 **Google Gemini API Key** (在 [Google AI Studio](https://aistudio.google.com/) 申请)。

### 1. 配置环境变量

1. 创建文件并重命名为 `.env`。
2. 打开 `.env`，将您的 API Key 填入：
   ```env
   GEMINI_API_KEY="AIzaSy您的真实API密钥在这里..."
   ```

### 2. 启动前端服务

在项目根目录下，打开终端运行以下命令：

```bash
# 安装前端依赖包
npm install

# 启动 Vite 开发服务器 (默认端口通常是 5173 左右)
npm run dev
```

### 3. 启动后端翻译引擎

打开一个新的终端窗口，进入 `backend` 目录，并配置虚拟环境：

```bash
cd backend

# 1. 创建虚拟环境 (如尚未创建)
python -m venv venv

# 2. 激活虚拟环境
# Windows (PowerShell):
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# 3. 安装后端依赖
pip install fastapi uvicorn opencv-python pillow google-genai python-multipart python-dotenv

# 4. 启动 FastAPI 服务 (运行在 8000 端口)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 💡 使用说明

1. 确保前端和后端服务均已启动。
2. 在浏览器中打开前端给出的本地地址 (通常为 `http://localhost:5173`)。
3. **翻译图片**：在“图片”选项卡中，拖拽或点击上传一张外语漫画截图。在顶部右上角选择您的“目标语言”，然后点击底部的 **“立即翻译”** 按钮。稍等片刻，右侧结果栏将直接显示替换好文字的全新漫画图片！
4. **翻译文本**：切换到“纯文本”选项卡，粘贴需要翻译的外文小说段落，点击翻译获取结果。

---

> **⚠️ 注意事项**：由于漫画排版、字体和画风的极其多样性，OpenCV 对某些特定背景上的嵌字擦除可能无法做到 100% 完美。目前的算法针对主流白底黑字的对话框进行了优化。
