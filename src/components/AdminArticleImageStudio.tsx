import { useState, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  Maximize2,
  Search,
  ArrowRight
} from 'lucide-react';

export interface AIGeneratedImageItem {
  id: string;
  fileName: string;
  fileUrl: string;
  prompt: string;
  fullPrompt: string;
  provider: 'gemini' | 'gemini_vector' | 'openai' | string;
  aspectRatio: string;
  createdAt: string;
  fileSize?: number;
  format?: string;
}

interface AdminArticleImageStudioProps {
  onInsertIntoArticle?: (imageUrl: string, prompt: string) => void;
  setNotice?: (msg: string) => void;
}

const STYLE_PRESETS = [
  {
    id: 'splashlearn_vector',
    label: '🎒 SplashLearn 2D Vector (Grades 1–10)',
    desc: 'Child-friendly flat vector with soft pastels, white background & clear educational diagrams',
    aspect: '4:3',
  },
  {
    id: 'vibrant_banner',
    label: '🌟 Vibrant Banner (16:9)',
    desc: 'Modern 3D digital art with volumetric lighting, ideal for article headers',
    aspect: '16:9',
  },
  {
    id: 'clean_infographic',
    label: '📐 Vector Infographic (4:3)',
    desc: 'Flat minimalist educational diagram with geometric precision and high contrast',
    aspect: '4:3',
  },
  {
    id: 'classical_sketch',
    label: '🏛️ Renaissance Sketch',
    desc: 'Leonardo da Vinci style vintage sepia etching on academic parchment',
    aspect: '4:3',
  },
  {
    id: 'abstract_math',
    label: '🌌 Cosmic / Abstract Math',
    desc: 'Glowing neon fractals, sacred geometry, and radiant particle waves',
    aspect: '16:9',
  },
  {
    id: 'chalkboard_blueprint',
    label: '✏️ Chalkboard & Blueprint',
    desc: 'Crisp blackboard drawing with turquoise chalk geometry & equations',
    aspect: '16:9',
  },
  {
    id: 'none',
    label: '🎯 Custom / Direct Prompt',
    desc: 'Exact text as entered without style wrapping',
    aspect: '16:9',
  },
];

const SUGGESTED_PROMPTS = [
  'Class 10 Trigonometry: Glowing golden triangle with sine and cosine wave harmonics on dark celestial space',
  'Pythagoras Theorem: 3D isometric wooden cubes illustrating a² + b² = c² in a modern laboratory',
  'Class 9 Polynomials: Glowing neon algebraic curves and intersecting parabolas in 3D grid space',
  'Fractal Geometry: Fibonacci golden ratio nautilus shell emerging from crystalline mathematical equation lattice',
  'Coordinate Geometry: High-contrast Cartesian coordinate plane with glowing hyperbola and tangent vectors',
];

export function AdminArticleImageStudio({ onInsertIntoArticle, setNotice }: AdminArticleImageStudioProps) {
  // Provider & API Keys
  const [provider, setProvider] = useState<'gemini' | 'gemini_vector' | 'openai'>('gemini_vector');
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('maths_mentor_admin_ai_key') || '';
  });
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Generation Controls
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('splashlearn_vector');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('4:3');
  const [targetGrade, setTargetGrade] = useState('Grades 1–10');
  const [subject, setSubject] = useState('Mathematics');
  const [importantLabels, setImportantLabels] = useState('');
  
  // Loading & Action States
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Gallery & Selected Image
  const [activeImage, setActiveImage] = useState<AIGeneratedImageItem | null>(null);
  const [gallery, setGallery] = useState<AIGeneratedImageItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Save custom key on change
  function handleKeyChange(val: string) {
    setCustomApiKey(val);
    localStorage.setItem('maths_mentor_admin_ai_key', val.trim());
  }

  // Load existing gallery on mount
  async function fetchGallery() {
    setLoadingGallery(true);
    try {
      const res = await fetch('/api/superadmin/ai-images', { credentials: 'same-origin' });
      const data = await res.json();
      if (res.ok && data.images) {
        setGallery(data.images);
        if (!activeImage && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }
      }
    } catch {
      // Failed to load gallery
    } finally {
      setLoadingGallery(false);
    }
  }

  useEffect(() => {
    void fetchGallery();
  }, []);

  // Update aspect ratio when preset changes
  function handlePresetChange(presetId: string) {
    setSelectedPreset(presetId);
    const found = STYLE_PRESETS.find((p) => p.id === presetId);
    if (found && found.aspect) {
      setAspectRatio(found.aspect as any);
    }
  }

  // Helper to build full educational prompt
  function buildEffectivePrompt() {
    if (selectedPreset === 'splashlearn_vector') {
      const parts = [`Topic: ${prompt.trim()}`];
      if (targetGrade) parts.push(`Target Grade: ${targetGrade}`);
      if (subject) parts.push(`Subject: ${subject}`);
      if (importantLabels.trim()) parts.push(`Important Labels or Elements: ${importantLabels.trim()}`);
      return parts.join('\n');
    }
    return prompt.trim();
  }

  // Magic prompt enhancement via LLM
  async function handleEnhancePrompt() {
    if (!prompt.trim()) {
      setErrorMessage('Please type a brief topic or prompt first to enhance it.');
      return;
    }
    setEnhancing(true);
    setErrorMessage('');
    setStatusMessage('Analyzing topic with AI & crafting vivid art direction...');

    try {
      const effective = buildEffectivePrompt();
      const res = await fetch('/api/superadmin/enhance-image-prompt', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: effective,
          stylePreset: selectedPreset,
          aspectRatio,
          provider,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to enhance prompt.');
      }

      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setStatusMessage('✨ Prompt enhanced with professional art direction!');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not enhance prompt.');
    } finally {
      setEnhancing(false);
    }
  }

  // Generate Image
  async function handleGenerate() {
    if (!prompt.trim()) {
      setErrorMessage('Please enter an image description or topic.');
      return;
    }

    setGenerating(true);
    setErrorMessage('');
    setStatusMessage(
      provider === 'gemini_vector'
        ? 'Calling Google Gemini AI... (Synthesizing SplashLearn vector art)'
        : provider === 'gemini'
        ? 'Calling Google Gemini Imagen 3... (Rendering photorealistic art)'
        : 'Calling ChatGPT OpenAI DALL·E 3... (Synthesizing composition)'
    );

    try {
      const effective = buildEffectivePrompt();
      const res = await fetch('/api/superadmin/generate-article-image', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: effective,
          provider,
          aspectRatio,
          stylePreset: selectedPreset,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Image generation failed.');
      }

      if (data.image) {
        setActiveImage(data.image);
        setGallery((prev) => [data.image, ...prev.filter((i) => i.id !== data.image.id)]);
        setStatusMessage('✓ Artwork successfully generated and saved to static media library!');
        if (setNotice) setNotice('AI Article image generated successfully!');
        setTimeout(() => setStatusMessage(''), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate image. Please check API key and parameters.');
    } finally {
      setGenerating(false);
    }
  }

  // Delete Image from gallery and disk
  async function handleDelete(item: AIGeneratedImageItem) {
    if (!window.confirm('Are you sure you want to delete this generated image from the server?')) return;

    try {
      const res = await fetch(`/api/superadmin/ai-images/${item.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setGallery((prev) => prev.filter((i) => i.id !== item.id));
        if (activeImage?.id === item.id) {
          const remaining = gallery.filter((i) => i.id !== item.id);
          setActiveImage(remaining.length > 0 ? remaining[0] : null);
        }
        if (setNotice) setNotice('Image removed from library.');
      }
    } catch {
      alert('Failed to delete image.');
    }
  }

  // Copy helpers
  function copyToClipboard(text: string, type: 'url' | 'html') {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2200);
    }
  }

  function getEmbedHtml(item: AIGeneratedImageItem) {
    return `<figure style="margin: 22px 0; text-align: center;"><img src="${item.fileUrl}" alt="${item.prompt}" style="max-width: 100%; max-height: 480px; border-radius: 12px; box-shadow: 0 6px 22px rgba(0,0,0,0.09);" /><figcaption style="font-size: 13px; color: #64748b; margin-top: 8px;"><em>${item.prompt}</em></figcaption></figure><p><br></p>`;
  }

  function handleDownloadImage(item: AIGeneratedImageItem) {
    if (!item) return;
    if (item.fileUrl.endsWith('.svg') || item.format === 'SVG') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1600;
          canvas.height = 900;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = item.fileName.replace(/\.svg$/i, '.png');
            a.click();
            return;
          }
        } catch {
          // fallback to direct download
        }
        const a = document.createElement('a');
        a.href = item.fileUrl;
        a.download = item.fileName;
        a.click();
      };
      img.onerror = () => {
        const a = document.createElement('a');
        a.href = item.fileUrl;
        a.download = item.fileName;
        a.click();
      };
      img.src = item.fileUrl;
    } else {
      const a = document.createElement('a');
      a.href = item.fileUrl;
      a.download = item.fileName;
      a.click();
    }
  }

  const filteredGallery = gallery.filter(
    (item) =>
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={22} color="#fbbf24" />
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AI Article Image Studio
            </h2>
          </div>
          <p style={{ margin: '8px 0 0', color: '#c7d2fe', fontSize: '14px', maxWidth: '640px' }}>
            Generate high-resolution educational banners, infographics, and mathematical visualizations for portal articles using{' '}
            <strong>Google Gemini (Imagen 3)</strong> and <strong>ChatGPT (OpenAI DALL·E 3)</strong>. All images are permanently stored on your server.
          </p>
        </div>

        {/* API Key Toggle Button */}
        <button
          type="button"
          onClick={() => setShowKeyConfig(!showKeyConfig)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: showKeyConfig ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
            color: showKeyConfig ? '#312e81' : '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Key size={15} />
          <span>{customApiKey ? 'Personal API Key Active' : 'Configure API Key'}</span>
        </button>
      </div>

      {/* Expandable API Key Settings Drawer */}
      {showKeyConfig && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
              <Key size={16} color="#6366f1" /> API Key Settings (Gemini & OpenAI)
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Stored safely in your admin browser session & verified by server
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Paste your Gemini Key (starts with AIza...) or OpenAI Key (starts with sk-...)"
                value={customApiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  background: '#f8fafc',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {customApiKey && (
              <button
                type="button"
                onClick={() => handleKeyChange('')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear Key
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Info size={13} color="#6366f1" /> If left blank, the server will automatically use <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> from <code>.env</code>.
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b45309' }}>
              <AlertCircle size={13} color="#d97706" /> Note: Google AI Studio restricts native Imagen 3 photorealistic generation to projects with Google Cloud billing linked. For standard free Gemini API keys, select <strong>Gemini Vector Art (100% Free)</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Studio Grid: Left = Generator Form, Right = Active Image Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 460px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Generator Form Controls */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wand2 size={17} color="#6366f1" /> Generator Parameters
            </h3>
          </div>

          {/* 1. Model Provider Switcher */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              AI Model Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setProvider('gemini_vector')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: provider === 'gemini_vector' ? '#10b981' : '#e2e8f0',
                  background: provider === 'gemini_vector' ? '#f0fdf4' : '#ffffff',
                  color: provider === 'gemini_vector' ? '#15803d' : '#475569',
                  fontWeight: provider === 'gemini_vector' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                }}
              >
                <span>Gemini Vector</span>
                <span style={{ fontSize: '9.5px', background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  100% Free
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: provider === 'gemini' ? '#6366f1' : '#e2e8f0',
                  background: provider === 'gemini' ? '#f5f3ff' : '#ffffff',
                  color: provider === 'gemini' ? '#4f46e5' : '#475569',
                  fontWeight: provider === 'gemini' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                }}
              >
                <span>Google Imagen 3</span>
                <span style={{ fontSize: '9.5px', background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  Cloud Billing
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: provider === 'openai' ? '#0ea5e9' : '#e2e8f0',
                  background: provider === 'openai' ? '#f0f9ff' : '#ffffff',
                  color: provider === 'openai' ? '#0369a1' : '#475569',
                  fontWeight: provider === 'openai' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                }}
              >
                <span>DALL·E 3</span>
                <span style={{ fontSize: '9.5px', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                  OpenAI Key
                </span>
              </button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
              {provider === 'gemini_vector' && '✨ 100% Free with any Google Gemini key! Creates crisp 2D SplashLearn-style educational vector SVG illustrations.'}
              {provider === 'gemini' && 'ℹ️ Photorealistic Google Imagen 3 art. Requires Google Cloud Billing linked in Google AI Studio.'}
              {provider === 'openai' && '🚀 Generates high-fidelity artwork with OpenAI DALL·E 3 using your OpenAI API key.'}
            </div>
          </div>

          {/* 2. Aspect Ratio Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Aspect Ratio
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['16:9', '4:3', '1:1'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: aspectRatio === ratio ? '#6366f1' : '#cbd5e1',
                    background: aspectRatio === ratio ? '#ede9fe' : '#ffffff',
                    color: aspectRatio === ratio ? '#6366f1' : '#64748b',
                    fontWeight: aspectRatio === ratio ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{ratio}</div>
                  <div style={{ fontSize: '10.5px', opacity: 0.8 }}>
                    {ratio === '16:9' ? 'Article Banner' : ratio === '4:3' ? 'Editorial Figure' : 'Square Diagram'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Style Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Educational Style Preset
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {STYLE_PRESETS.map((p) => {
                const active = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: active ? '#6366f1' : '#f1f5f9',
                      background: active ? '#f5f3ff' : '#fafafa',
                      color: active ? '#1e1b4b' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: active ? 700 : 600 }}>{p.label}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Prompt Textarea & Magic Enhance */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                Article Topic or Visual Prompt
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={enhancing || generating || !prompt.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
                  border: '1px solid #c4b5fd',
                  color: '#7c3aed',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: prompt.trim() && !enhancing ? 'pointer' : 'not-allowed',
                  opacity: prompt.trim() && !enhancing ? 1 : 0.6,
                }}
              >
                <Sparkles size={12} className={enhancing ? 'spin' : ''} />
                {enhancing ? 'Enhancing...' : 'Magic Enhance ✨'}
              </button>
            </div>

            {/* SplashLearn Educational Context Parameters */}
            {selectedPreset === 'splashlearn_vector' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎒 SplashLearn Vector Parameters</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '3px' }}>
                      Target Grade
                    </label>
                    <select
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', background: '#ffffff', color: '#0f172a' }}
                    >
                      <option value="Grades 1–5 (Primary)">Grades 1–5 (Primary)</option>
                      <option value="Grades 6–8 (Middle)">Grades 6–8 (Middle)</option>
                      <option value="Grades 9–10 (Secondary)">Grades 9–10 (Secondary)</option>
                      <option value="Grades 1–10 (All School)">Grades 1–10 (All School)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '3px' }}>
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', background: '#ffffff', color: '#0f172a' }}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Environmental Studies">Environmental Studies</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '3px' }}>
                    Important Labels or Elements (Optional)
                  </label>
                  <input
                    type="text"
                    value={importantLabels}
                    onChange={(e) => setImportantLabels(e.target.value)}
                    placeholder="e.g. Hypotenuse, Base, 90° Right Angle, Vertex A, B, C"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12px', background: '#ffffff', color: '#0f172a' }}
                  />
                </div>
              </div>
            )}

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. Class 10 Trigonometry: A glowing golden triangle on a dark chalkboard with trigonometric waves and celestial spheres..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                lineHeight: '1.45',
                resize: 'vertical',
                background: '#ffffff',
              }}
            />

            {/* Quick Inspiration Pills */}
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Topics: </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                {SUGGESTED_PROMPTS.slice(0, 3).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(sug)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '9999px',
                      padding: '3px 9px',
                      fontSize: '11px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {sug.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Status / Error Banners */}
          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', color: '#b91c1c', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, lineHeight: '1.45' }}>{errorMessage}</div>
              </div>
              {errorMessage.includes('ChatGPT') && provider !== 'openai' && (
                <button
                  type="button"
                  onClick={() => {
                    setProvider('openai');
                    setErrorMessage('');
                  }}
                  style={{
                    marginTop: '8px',
                    marginLeft: '24px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid #10b981',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  👉 Switch to ChatGPT DALL·E 3
                </button>
              )}
            </div>
          )}

          {statusMessage && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', color: '#047857', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || enhancing || !prompt.trim()}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: generating
                ? '#94a3b8'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              cursor: generating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>Generating Image with {provider === 'gemini' ? 'Imagen 3' : 'DALL·E 3'}...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Article Image</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Active Preview & Embed Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Preview Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#6366f1" />
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                  {activeImage ? 'Artwork Preview' : 'No Image Generated Yet'}
                </span>
              </div>

              {activeImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {activeImage.fileSize && (
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      ⚡ {Math.round(activeImage.fileSize / 1024)} KB ({activeImage.format || 'WEBP'})
                    </span>
                  )}
                  <span style={{ fontSize: '11.5px', background: activeImage.provider === 'gemini' ? '#ede9fe' : '#d1fae5', color: activeImage.provider === 'gemini' ? '#6d28d9' : '#047857', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    {activeImage.provider === 'gemini' ? 'Gemini Imagen 3' : 'DALL·E 3'}
                  </span>
                  <span style={{ fontSize: '11.5px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {activeImage.aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {/* Image Canvas / Container */}
            <div
              style={{
                background: '#0f172a',
                minHeight: '360px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '16px',
              }}
            >
              {activeImage ? (
                <div
                  style={{
                    position: 'relative',
                    maxWidth: '100%',
                    maxHeight: '520px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                  }}
                >
                  <img
                    src={activeImage.fileUrl}
                    alt={activeImage.prompt}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-load-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'img-load-fallback';
                        fallback.style.cssText = 'padding: 40px 24px; text-align: center; color: #dc2626; font-size: 13px; font-weight: 600;';
                        fallback.innerHTML = '⚠️ Image preview could not load. Click "Generate Article Image" to create a fresh visual.';
                        parent.appendChild(fallback);
                      }
                    }}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxImage(activeImage.fileUrl)}
                    title="View Fullscreen Lightbox"
                    style={{
                      position: 'absolute',
                      right: '16px',
                      bottom: '16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 20px' }}>
                  <ImageIcon size={48} color="#475569" style={{ margin: '0 auto 14px' }} />
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Ready to generate an article visual</p>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Select a style preset on the left, type a topic, and click "Generate Article Image".
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar (Copy URL, HTML Embed, Download) */}
            {activeImage && (
              <div style={{ padding: '18px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Prompt Used
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
                    "{activeImage.prompt}"
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(window.location.origin + activeImage.fileUrl, 'url')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: copiedUrl ? '#16a34a' : '#1e293b',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedUrl ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                    <span>{copiedUrl ? 'Copied Full URL!' : 'Copy Image URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(getEmbedHtml(activeImage), 'html')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: copiedHtml ? '#16a34a' : '#4338ca',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedHtml ? <Check size={15} color="#16a34a" /> : <FileText size={15} />}
                    <span>{copiedHtml ? 'Copied HTML!' : 'Copy <figure> Embed Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadImage(activeImage)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#1e293b',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={15} />
                    <span>Download {activeImage.format === 'SVG' ? 'PNG / SVG' : (activeImage.format || 'PNG')}</span>
                  </button>

                  {onInsertIntoArticle && (
                    <button
                      type="button"
                      onClick={() => onInsertIntoArticle(activeImage.fileUrl, activeImage.prompt)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: 'auto',
                      }}
                    >
                      <ArrowRight size={15} /> Insert into Article Editor
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent AI Gallery */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} color="#6366f1" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Media Repository ({gallery.length} Images)
                </h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search prompt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 10px 6px 30px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      width: '160px',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchGallery}
                  disabled={loadingGallery}
                  title="Refresh Gallery"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  <RefreshCw size={14} className={loadingGallery ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {loadingGallery ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                <span>Loading media repository...</span>
              </div>
            ) : filteredGallery.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No images found. Generate your first visual using the form above!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {filteredGallery.map((item) => {
                  const isCurrent = activeImage?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveImage(item)}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isCurrent ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        background: '#0f172a',
                        aspectRatio: item.aspectRatio === '16:9' ? '16/9' : item.aspectRatio === '4:3' ? '4/3' : '1/1',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none',
                      }}
                    >
                      <img
                        src={item.fileUrl}
                        alt={item.prompt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          padding: '6px',
                          color: '#ffffff',
                        }}
                      >
                        <div style={{ fontSize: '10.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.prompt}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '9px', opacity: 0.8 }}>{item.provider}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(item);
                            }}
                            title="Delete"
                            style={{
                              background: 'rgba(239, 68, 68, 0.85)',
                              border: 'none',
                              color: '#ffffff',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={lightboxImage}
              alt="Enlarged"
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                background: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                width: '32px',
                height: '32px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
