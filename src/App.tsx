import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Type, Copy, Check, Languages, Waves, Sparkles, PenTool } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

const TARGET_LANGUAGES = [
  { value: 'Chinese (Simplified)', label: { en: 'Simplified Chinese', zh: '简体中文' } },
  { value: 'Chinese (Traditional)', label: { en: 'Traditional Chinese', zh: '繁体中文' } },
  { value: 'English', label: { en: 'English', zh: '英语' } },
  { value: 'Japanese', label: { en: 'Japanese', zh: '日语' } },
  { value: 'Korean', label: { en: 'Korean', zh: '韩语' } },
  { value: 'Spanish', label: { en: 'Spanish', zh: '西班牙语' } },
  { value: 'French', label: { en: 'French', zh: '法语' } },
];

const i18n = {
  en: {
    title: 'MangaMage',
    subtitle: ' ✨',
    uiLang: 'EN',
    translateTo: 'Translate to:',
    tabImage: 'Image (Manga)',
    tabText: 'Raw Text',
    uploadTitle: 'Drop your artwork here',
    uploadDesc: 'Drag & drop a manga page or click to browse.',
    changeImage: 'Change Image',
    pasteText: 'Paste your raw text here...',
    translateBtn: 'Translate',
    translating: 'Translating...',
    resultTitle: 'Translation Result',
    emptyResult: 'Your translation will appear here.',
    errorImage: 'Please upload an image first.',
    errorText: 'Please enter some text to translate.',
  },
  zh: {
    title: 'MangaMage',
    subtitle: ' 漫法魔书',
    uiLang: '中',
    translateTo: '目标语言:',
    tabImage: '图片 (漫画/小说)',
    tabText: '纯文本',
    uploadTitle: '将作品拖拽至此',
    uploadDesc: '拖拽漫画页面到此处，或者点击上传。',
    changeImage: '更换图片',
    pasteText: '在这里粘贴你的纯文本...',
    translateBtn: '立即翻译',
    translating: '翻译中...',
    resultTitle: '翻译结果',
    emptyResult: '翻译结果会显示在这里。',
    errorImage: '请先上传一张图片。',
    errorText: '请先输入一些文字。',
  }
};

export default function App() {
  const [uiLang, setUiLang] = useState<'en' | 'zh'>('zh');
  const t = i18n[uiLang];

  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [targetLanguage, setTargetLanguage] = useState(TARGET_LANGUAGES[0].value);

  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [sourceText, setSourceText] = useState('');

  const [translatedText, setTranslatedText] = useState('');
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setTranslatedText('');
      setTranslatedImage(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSourceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setTranslatedText('');
      setTranslatedImage(null);
      setError(null);
    }
  };

  const copyToClipboard = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleUiLang = () => {
    setUiLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const translate = async () => {
    if (activeTab === 'image' && !sourceImage) {
      setError(t.errorImage);
      return;
    }
    if (activeTab === 'text' && !sourceText.trim()) {
      setError(t.errorText);
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslatedText('');
    setTranslatedImage(null);

    try {
      if (activeTab === 'image' && sourceImage && imagePreview) {
        const formData = new FormData();
        formData.append('image', sourceImage);
        formData.append('target_language', targetLanguage);

        const response = await fetch('http://localhost:8000/api/translate/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.translatedImageBase64) {
          setTranslatedImage(`data:image/jpeg;base64,${data.translatedImageBase64}`);
        }
        setTranslatedText(data.translatedText || 'No translation generated.');
      } else if (activeTab === 'text') {
        const response = await fetch('http://localhost:8000/api/translate/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: sourceText,
            target_language: targetLanguage,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Server error: ${response.status}`);
        }
        const data = await response.json();
        setTranslatedText(data.translatedText || 'No translation generated.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'An error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-waves text-slate-800 font-sans selection:bg-purple-100 selection:text-purple-900 pb-12">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-600/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-baseline gap-1">
              <span className="text-purple-600">{t.title}</span>
              <span className="text-slate-700">{t.subtitle}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-purple-50 rounded-full px-4 py-1.5 border border-purple-200">
              <label className="text-sm font-semibold text-slate-600">{t.translateTo}</label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-purple-600 focus:ring-0 cursor-pointer outline-none"
              >
                {TARGET_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label[uiLang]}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={toggleUiLang}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 font-bold text-slate-600 hover:bg-slate-50 hover:text-purple-600 shadow-sm transition-colors"
            >
              <Languages className="w-4 h-4" />
              {t.uiLang}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 mt-8 relative z-10">

        {/* Mobile Target Language (visible only on small screens) */}
        <div className="sm:hidden flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 mb-6 shadow-sm border border-white/50">
          <label className="text-sm font-semibold text-slate-600">{t.translateTo}</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-purple-600 focus:ring-0 cursor-pointer outline-none flex-1"
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label[uiLang]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Input Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-purple-600/5 border border-white/60 overflow-hidden flex flex-col min-h-[500px]">
              {/* Tabs */}
              <div className="flex p-2 bg-slate-50/50 border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('image')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-2xl transition-all",
                    activeTab === 'image' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-700"
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  {t.tabImage}
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-2xl transition-all",
                    activeTab === 'text' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-700"
                  )}
                >
                  <Type className="w-4 h-4" />
                  {t.tabText}
                </button>
              </div>

              {/* Input Area */}
              {activeTab === 'image' ? (
                <div
                  className="flex-1 flex flex-col relative p-4"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="relative flex-1 flex items-center justify-center group rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img
                        src={imagePreview}
                        alt="Source"
                        className="max-h-[400px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-slate-800 px-6 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Upload className="w-4 h-4" />
                          {t.changeImage}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex flex-col items-center justify-center p-8 text-center cursor-pointer border-2 border-dashed border-purple-300 bg-purple-50/50 rounded-2xl hover:bg-purple-100/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-20 h-20 bg-white text-purple-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-purple-600/10 animate-float">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">{t.uploadTitle}</h3>
                      <p className="text-sm font-medium text-slate-500 max-w-xs">
                        {t.uploadDesc}
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-4">
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t.pasteText}
                    className="flex-1 w-full resize-none outline-none bg-slate-50 border border-slate-100 rounded-2xl p-5 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-2xl font-semibold text-sm shadow-sm w-full text-center">
                  {error}
                </div>
              )}
              <button
                onClick={translate}
                disabled={isTranslating || (activeTab === 'image' && !sourceImage) || (activeTab === 'text' && !sourceText.trim())}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all"
              >
                {isTranslating ? (
                  <>
                    <PenTool className="w-5 h-5 animate-spin-slow" />
                    {t.translating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t.translateBtn}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-purple-600/5 border border-white/60 overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                {t.resultTitle}
              </h3>
              {translatedText && (
                <button
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-purple-600 hover:bg-purple-100 p-2 rounded-xl transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-5 h-5 text-purple-600" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {isTranslating ? (
                <div className="h-full flex flex-col items-center justify-center text-purple-600 space-y-4">
                  <PenTool className="w-10 h-10 animate-bounce" />
                  <p className="text-base font-bold">{t.translating}</p>
                </div>
              ) : translatedImage ? (
                <div className="h-full flex flex-col items-center justify-center p-4">
                  <img src={translatedImage} alt="Translated" className="max-h-full object-contain rounded-xl shadow-md border border-slate-200" />
                </div>
              ) : translatedText ? (
                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-purple-600 prose-strong:text-slate-800">
                  <Markdown>{translatedText}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Waves className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-base font-medium">{t.emptyResult}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
