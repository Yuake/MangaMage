import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Type, Copy, Check, Languages, Waves, Sparkles, PenTool, FileImage, Folder, X, Archive, Download } from 'lucide-react';
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
    modeFile: 'Upload Images',
    modeDir: 'Upload Directory',
    uploadHintFile: 'Up to 9 images. For more, use Upload Directory.',
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
    modeFile: '上传图片',
    modeDir: '上传目录',
    uploadHintFile: '最多上传9张图片，如需超额请使用上传目录',
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
  const [uploadMode, setUploadMode] = useState<'file' | 'directory'>('file');
  const [targetLanguage, setTargetLanguage] = useState(TARGET_LANGUAGES[0].value);

  const [sourceImages, setSourceImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [sourceText, setSourceText] = useState('');

  const [translatedText, setTranslatedText] = useState('');
  const [translatedImages, setTranslatedImages] = useState<string[]>([]);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleModeChange = (mode: 'file' | 'directory') => {
    setUploadMode(mode);
    setSourceImages([]);
    setImagePreviews([]);
    setTranslatedText('');
    setTranslatedImages([]);
    setZipBlobUrl(null);
    setError(null);
  };

  const clearImages = () => {
    setSourceImages([]);
    setImagePreviews([]);
    setTranslatedText('');
    setTranslatedImages([]);
    setZipBlobUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setSourceImages(prev => prev.filter((_, i) => i !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    if (sourceImages.length <= 1) {
      clearImages();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = uploadMode === 'directory' ? files.filter(f => f.type.startsWith('image/')) : files.filter(f => f.type.startsWith('image/')).slice(0, 9);
    if (imageFiles.length > 0) {
      setSourceImages(imageFiles);
      
      if (uploadMode === 'file') {
        const newPreviews: string[] = [];
        let loaded = 0;
        
        imageFiles.forEach((file, index) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews[index] = reader.result as string;
            loaded++;
            if (loaded === imageFiles.length) {
              setImagePreviews([...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        setImagePreviews([]);
      }
      
      setTranslatedText('');
      setTranslatedImages([]);
      setZipBlobUrl(null);
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
    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = uploadMode === 'directory' ? files.filter(f => f.type.startsWith('image/')) : files.filter(f => f.type.startsWith('image/')).slice(0, 9);
    if (imageFiles.length > 0) {
      setSourceImages(imageFiles);
      
      if (uploadMode === 'file') {
        const newPreviews: string[] = [];
        let loaded = 0;
        
        imageFiles.forEach((file, index) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews[index] = reader.result as string;
            loaded++;
            if (loaded === imageFiles.length) {
              setImagePreviews([...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        setImagePreviews([]);
      }
      
      setTranslatedText('');
      setTranslatedImages([]);
      setZipBlobUrl(null);
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
    if (activeTab === 'image' && sourceImages.length === 0) {
      setError(t.errorImage);
      return;
    }
    if (activeTab === 'text' && !sourceText.trim()) {
      setError(t.errorText);
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);
    setError(null);
    setTranslatedText('');
    setTranslatedImages([]);
    setZipBlobUrl(null);

    try {
      if (activeTab === 'image' && sourceImages.length > 0 && (imagePreviews.length > 0 || uploadMode === 'directory')) {
        if (uploadMode === 'file') {
          // Send separate requests for each image
          let completed = 0;
          const promises = sourceImages.map(async (img) => {
            const formData = new FormData();
            formData.append('image', img);
            formData.append('target_language', targetLanguage);
            const response = await fetch('http://localhost:8000/api/translate/image', {
              method: 'POST',
              body: formData,
            });
            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.detail || `Server error: ${response.status}`);
            }
            completed++;
            setTranslationProgress((completed / sourceImages.length) * 100);
            return response.json();
          });
          
          const results = await Promise.all(promises);
          const newTranslatedImages = results.map(r => r.translatedImageBase64 ? `data:image/jpeg;base64,${r.translatedImageBase64}` : null).filter(Boolean) as string[];
          
          setTranslatedImages(newTranslatedImages);
          if (newTranslatedImages.length === 1 && results[0].translatedText) {
             setTranslatedText(results[0].translatedText);
          } else {
             setTranslatedText(`Successfully translated ${newTranslatedImages.length} images.`);
          }
          
        } else {
          // Directory mode: send to zip endpoint
          const interval = setInterval(() => {
            setTranslationProgress(p => p < 90 ? p + 5 : p);
          }, 1000);

          const formData = new FormData();
          formData.append('target_language', targetLanguage);
          sourceImages.forEach(file => {
            formData.append('images', file);
          });
          const response = await fetch('http://localhost:8000/api/translate/images-zip', {
            method: 'POST',
            body: formData,
          });

          clearInterval(interval);
          setTranslationProgress(100);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Server error: ${response.status}`);
          }
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          setZipBlobUrl(url);
          setTranslatedText(`Successfully generated ZIP file with ${sourceImages.length} translated images.`);
        }
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
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="flex bg-slate-100/50 p-1 rounded-xl mb-6 border border-slate-200 w-[260px] relative z-20">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleModeChange('file'); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-bold rounded-lg transition-all", uploadMode === 'file' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                      >
                        <FileImage className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.modeFile}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleModeChange('directory'); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-bold rounded-lg transition-all", uploadMode === 'directory' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                      >
                        <Folder className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.modeDir}</span>
                      </button>
                    </div>

                    {uploadMode === 'directory' && sourceImages.length > 0 ? (
                      <div className="relative w-full flex-1 flex flex-col items-center justify-center group rounded-2xl bg-purple-50/50 border border-purple-200">
                        <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-purple-600/10">
                          <Folder className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">{sourceImages[0]?.webkitRelativePath.split('/')[0] || 'Selected Directory'}</h3>
                        <p className="text-md font-medium text-purple-600 bg-purple-100 px-4 py-1.5 rounded-full">
                          Contains {sourceImages.length} images
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearImages(); }}
                          className="absolute top-4 left-4 bg-white/90 text-slate-700 hover:text-red-500 hover:bg-red-50 p-2 rounded-full shadow-md transition-colors z-20"
                          title="Clear selection"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : uploadMode === 'file' && imagePreviews.length > 0 ? (
                      <div className="relative w-full flex-1 flex flex-col group rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 p-2">
                        <div className={cn(
                          "w-full h-full min-h-[300px] grid gap-2 place-items-center relative z-10",
                          imagePreviews.length === 1 && "grid-cols-1 grid-rows-1",
                          imagePreviews.length === 2 && "grid-cols-2 grid-rows-1",
                          imagePreviews.length === 3 && "grid-cols-3 grid-rows-1",
                          imagePreviews.length === 4 && "grid-cols-2 grid-rows-2",
                          (imagePreviews.length === 5 || imagePreviews.length === 6) && "grid-cols-3 grid-rows-2",
                          imagePreviews.length >= 7 && "grid-cols-3 grid-rows-3"
                        )}>
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="w-full h-full relative flex items-center justify-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm aspect-[3/4] group/item">
                              <img
                                src={preview}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                className="absolute top-2 right-2 bg-slate-900/60 text-white hover:bg-red-500 hover:text-white p-1.5 rounded-full shadow-md transition-colors opacity-0 group-hover/item:opacity-100 z-30"
                                title="Remove this image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        {sourceImages.length > 1 && (
                          <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-sm text-white font-bold px-3 py-1 rounded-full text-sm shadow-md z-20 pointer-events-none">
                            {sourceImages.length} images
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); clearImages(); }}
                          className="absolute top-4 left-4 bg-white/90 text-slate-700 hover:text-red-500 hover:bg-red-50 p-2 rounded-full shadow-md transition-colors z-20"
                          title="Remove images"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-full flex-1 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-purple-300 bg-purple-50/50 rounded-2xl hover:bg-purple-100/50 transition-colors py-6"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 bg-white text-purple-600 rounded-full flex items-center justify-center mb-4 shadow-md shadow-purple-600/10 animate-float">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">{t.uploadTitle}</h3>
                        <p className="text-xs font-medium text-slate-500 max-w-xs mt-1">
                          {uploadMode === 'file' ? t.uploadHintFile : t.uploadDesc}
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadMode === 'file' ? (
                    <input
                      key="file-input"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      multiple
                    />
                  ) : (
                    <input
                      key="dir-input"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      multiple
                      // @ts-ignore
                      webkitdirectory=""
                    />
                  )}
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
                disabled={isTranslating || (activeTab === 'image' && sourceImages.length === 0) || (activeTab === 'text' && !sourceText.trim())}
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

            <div className="flex-1 p-8 overflow-y-auto w-full">
              {isTranslating ? (
                <div className="h-full flex flex-col items-center justify-center text-purple-600 space-y-4 px-8 w-full">
                  <PenTool className="w-10 h-10 animate-bounce" />
                  <p className="text-base font-bold">{t.translating}</p>
                  <div className="w-full max-w-sm bg-purple-100 rounded-full h-2.5 mt-4 overflow-hidden shadow-inner">
                    <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-[400ms] shadow-sm" style={{ width: `${Math.min(100, Math.max(5, translationProgress))}%` }}></div>
                  </div>
                  <p className="text-sm font-bold text-purple-600">{Math.round(translationProgress)}%</p>
                </div>
              ) : zipBlobUrl ? (
                <div className="h-full flex flex-col items-center justify-center p-4">
                  <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6 shadow-md shadow-purple-600/10">
                    <Archive className="w-12 h-12 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Translation Complete</h4>
                  <p className="text-slate-500 font-medium mb-8 text-center max-w-sm">{translatedText}</p>
                  <a
                    href={zipBlobUrl}
                    download="translated_images.zip"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download ZIP
                  </a>
                </div>
              ) : translatedImages.length > 0 ? (
                <div className="h-full flex flex-col items-center justify-start p-4">
                  <p className="text-sm font-semibold text-slate-500 mb-4">{translatedText}</p>
                  <div className={cn(
                    "w-full grid gap-4 relative z-10",
                    translatedImages.length === 1 && "grid-cols-1 grid-rows-1 place-items-center h-full",
                    translatedImages.length === 2 && "grid-cols-2 grid-rows-1",
                    translatedImages.length === 3 && "grid-cols-3 grid-rows-1",
                    translatedImages.length === 4 && "grid-cols-2 grid-rows-2",
                    (translatedImages.length === 5 || translatedImages.length === 6) && "grid-cols-3 grid-rows-2",
                    translatedImages.length >= 7 && "grid-cols-3 grid-rows-3"
                  )}>
                    {translatedImages.map((imgSrc, idx) => (
                      <div key={idx} className="w-full relative flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm aspect-[3/4]">
                        <img
                          src={imgSrc}
                          alt={`Translated ${idx + 1}`}
                          className="w-full h-full object-cover hover:object-contain transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
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
