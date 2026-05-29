import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Loader2, 
  ArrowLeft, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  FileText, 
  Package, 
  Check, 
  X,
  RefreshCcw,
  Clock,
  Search,
  Files
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { createExtractorFromData } from 'node-unrar-js';

interface ProductData {
  nome: string;
  slug?: string;
  marca?: string;
  categoria?: string;
  descricao?: string;
  preco_original?: number;
  preco_atual?: number;
  estoque?: number;
  ativo?: boolean;
  destaque?: boolean;
  novidade?: boolean;
  imagem_arquivo?: string;
  imagem_principal_file?: string;
  outras_imagens_files?: string[];
}

interface ImportItem {
  data: ProductData;
  status: 'pending' | 'importing' | 'success' | 'error';
  error?: string;
  previewUrl?: string;
  mainImageFile?: File;
  otherImageFiles?: File[];
  hasPreviewError?: boolean;
}

interface DiagnosticInfo {
  totalFiles: number;
  totalImages: number;
  imageNames: string[];
  missingImages: string[];
  rarFound: boolean;
  expectedNames: string[];
}

const CATEGORIAS_REAIS = [
  'Vestidos', 'Blusas', 'Calças', 'Conjuntos', 'Jaquetas', 'Saias', 'Acessórios'
];

const ImportProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, number>>({});
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const reprocessInputRef = useRef<HTMLInputElement>(null);

  const [defaultPrice, setDefaultPrice] = useState(0);
  const [defaultOldPrice, setDefaultOldPrice] = useState(0);
  const [defaultStock, setDefaultStock] = useState(10);
  const [defaultCategoryName, setDefaultCategoryName] = useState('Geral');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categorias').select('id, nome');
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(c => map[c.nome.toLowerCase()] = c.id);
        setCategoriesMap(map);
      }
    } catch (e) {
      console.error('Erro ao buscar categorias:', e);
    }
  };

  const normalizeString = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '');
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };

  const cleanFileNameToName = (fileName: string) => {
    return fileName
      .split('.')
      .shift()
      ?.replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || 'Produto';
  };

  const getOrCreateCategory = async (categoryName: string) => {
    const nameLower = (categoryName || 'Geral').toLowerCase();
    if (categoriesMap[nameLower]) return categoriesMap[nameLower];

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome: categoryName || 'Geral', ativo: true, slug: generateSlug(categoryName || 'Geral') }])
      .select()
      .single();

    if (error) return null;
    setCategoriesMap(prev => ({ ...prev, [nameLower]: data.id }));
    return data.id;
  };

  const findImageInList = (searchTerm: string, imageFiles: Record<string, File>) => {
    const normalizedSearch = normalizeString(searchTerm.split('.').shift() || '');
    if (!normalizedSearch) return null;

    // 1. Tentar match exato pelo path
    if (imageFiles[searchTerm]) return imageFiles[searchTerm];

    // 2. Tentar match pelo final do path (nome do arquivo)
    const entryByFileName = Object.entries(imageFiles).find(([path]) => {
      const fileName = path.split('/').pop() || '';
      return normalizeString(fileName.split('.').shift() || '') === normalizedSearch;
    });
    if (entryByFileName) return entryByFileName[1];

    // 3. Tentar match parcial se for longo o suficiente
    if (normalizedSearch.length > 3) {
      const entryPartial = Object.entries(imageFiles).find(([path]) => {
        const fileName = normalizeString(path.split('/').pop() || '');
        return fileName.includes(normalizedSearch);
      });
      if (entryPartial) return entryPartial[1];
    }

    return null;
  };

  const processZipFiles = async (zipContents: JSZip, manualImages: File[] = []) => {
    const imageFiles: Record<string, File> = {};
    let productDataList: ProductData[] = [];
    let foundDataFile = false;
    let rarFound = false;
    let totalFiles = 0;

    // 1. Processar Manual Images (soltas)
    manualImages.forEach(file => {
      imageFiles[file.name] = file;
    });

    // 2. Processar ZIP
    if (zipContents) {
      const files = Object.entries(zipContents.files);
      totalFiles = files.length;
      
      for (const [path, entry] of files) {
        if (entry.dir) continue;
        if (path.includes('__MACOSX') || path.includes('.DS_Store') || path.startsWith('.')) continue;

        const fileName = path.split('/').pop() || '';
        if (fileName.match(/\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i)) {
          const blob = await entry.async('blob');
          const ext = fileName.split('.').pop()?.toLowerCase();
          let mimeType = blob.type;
          
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'webp') mimeType = 'image/webp';
            else if (ext === 'mp4') mimeType = 'video/mp4';
          }

          imageFiles[path] = new File([blob], fileName, { type: mimeType });
        } else if (fileName.toLowerCase().endsWith('.rar')) {
          rarFound = true;
        } else if (fileName.toLowerCase() === 'produtos.csv') {
          const csvText = await entry.async('string');
          const result = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
          productDataList = result.data as any[];
          foundDataFile = true;
        } else if (fileName.toLowerCase() === 'produtos.json') {
          const jsonText = await entry.async('string');
          try {
            productDataList = JSON.parse(jsonText);
            foundDataFile = true;
          } catch (e) {
            console.error('Erro JSON:', e);
          }
        }
      }
    }

    const totalImages = Object.keys(imageFiles).length;
    const imageNames = Object.keys(imageFiles).slice(0, 20);

    return { imageFiles, productDataList, foundDataFile, rarFound, totalFiles, totalImages, imageNames };
  };

  const processRarFiles = async (rarFile: File) => {
    const imageFiles: Record<string, File> = {};
    let productDataList: ProductData[] = [];
    let foundDataFile = false;
    let totalFiles = 0;

    try {
      const arrayBuffer = await rarFile.arrayBuffer();
      const extractor = await createExtractorFromData({ 
        data: arrayBuffer,
        wasmBinary: await fetch('https://unpkg.com/node-unrar-js@2.0.2/dist/js/unrar.wasm').then(res => res.arrayBuffer())
      });
      
      const list = extractor.getFileList();
      const fileHeaders = [...list.fileHeaders];
      totalFiles = fileHeaders.length;

      const extracted = extractor.extract();
      for (const file of extracted.files) {
        if (file.fileHeader.flags.directory) continue;
        
        const path = file.fileHeader.name;
        if (path.includes('__MACOSX') || path.includes('.DS_Store') || path.startsWith('.')) continue;

        const fileName = path.split('/').pop() || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        
        if (fileName.match(/\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i)) {
          let mimeType = 'image/jpeg';
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'webp') mimeType = 'image/webp';
          else if (ext === 'mp4') mimeType = 'video/mp4';
          
          imageFiles[path] = new File([file.extraction as any], fileName, { type: mimeType });
        } else if (fileName.toLowerCase() === 'produtos.csv') {
          const csvText = new TextDecoder().decode(file.extraction as any);
          const result = Papa.parse(csvText, { header: true, dynamicTyping: true, skipEmptyLines: true });
          productDataList = result.data as any[];
          foundDataFile = true;
        } else if (fileName.toLowerCase() === 'produtos.json') {
          const jsonText = new TextDecoder().decode(file.extraction as any);
          try {
            productDataList = JSON.parse(jsonText);
            foundDataFile = true;
          } catch (e) {
            console.error('Erro JSON:', e);
          }
        }
      }
    } catch (e: any) {
      console.error('Erro ao extrair RAR:', e);
      throw new Error('Não foi possível extrair o arquivo RAR no navegador. Extraia o RAR e envie um ZIP com as imagens soltas.');
    }

    const totalImages = Object.keys(imageFiles).length;
    const imageNames = Object.keys(imageFiles).slice(0, 20);

    return { imageFiles, productDataList, foundDataFile, rarFound: false, totalFiles, totalImages, imageNames };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    const loadingToastId = toast.loading('Processando arquivo...');

    try {
      let imageFiles: Record<string, File> = {};
      let productDataList: ProductData[] = [];
      let foundDataFile = false;
      let rarFound = false;
      let totalFiles = 0;
      let totalImages = 0;
      let imageNames: string[] = [];

      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const processed = await processZipFiles(contents);
        imageFiles = processed.imageFiles;
        productDataList = processed.productDataList;
        foundDataFile = processed.foundDataFile;
        rarFound = processed.rarFound;
        totalFiles = processed.totalFiles;
        totalImages = processed.totalImages;
        imageNames = processed.imageNames;
      } else if (file.name.toLowerCase().endsWith('.rar')) {
        const processed = await processRarFiles(file);
        imageFiles = processed.imageFiles;
        productDataList = processed.productDataList;
        foundDataFile = processed.foundDataFile;
        rarFound = false;
        totalFiles = processed.totalFiles;
        totalImages = processed.totalImages;
        imageNames = processed.imageNames;
      } else {
        throw new Error('Formato de arquivo não suportado. Use .zip ou .rar');
      }


      if (rarFound) {
        toast.error('RAR encontrado dentro do ZIP. Extraia o RAR e envie um ZIP com as imagens soltas ou envie o RAR diretamente.', { duration: 6000 });
      }

      let list = productDataList;
      if (!foundDataFile || list.length === 0) {
        list = Object.entries(imageFiles).map(([path, f]) => ({
          nome: cleanFileNameToName(f.name),
          imagem_arquivo: path,
          marca: 'LOJA',
          categoria: defaultCategoryName,
          preco_atual: defaultPrice,
          preco_original: defaultOldPrice,
          estoque: defaultStock
        }));
      }

      const missingImages: string[] = [];
      const items: ImportItem[] = list.filter(p => p && p.nome).map(p => {
        const searchTerm = p.imagem_arquivo || p.nome || '';
        const mainImageFile = findImageInList(searchTerm, imageFiles);
        
        let previewUrl = undefined;
        if (mainImageFile) {
          previewUrl = URL.createObjectURL(mainImageFile);
        } else {
          missingImages.push(p.nome);
        }

        return {
          data: {
            ...p,
            marca: p.marca || 'LOJA',
            preco_original: Number(p.preco_original) || defaultOldPrice,
            preco_atual: Number(p.preco_atual) || defaultPrice,
            estoque: Number(p.estoque) || defaultStock,
            categoria: p.categoria || defaultCategoryName
          },
          status: 'pending',
          mainImageFile,
          previewUrl,
          hasPreviewError: false
        };
      });

      const expectedNames = list.map(p => p.imagem_arquivo || p.nome).slice(0, 20);
      setDiagnostic({ totalFiles, totalImages, imageNames, missingImages: missingImages.slice(0, 20), rarFound, expectedNames });
      setImportItems(items);
      toast.success(`${items.length} produtos preparados!`, { id: loadingToastId });
    } catch (error: any) {
      toast.error('Erro: ' + error.message, { id: loadingToastId });
    } finally {
      setExtracting(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleManualImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    const newItems = importItems.map(item => {
      if (item.mainImageFile && !item.hasPreviewError) return item;

      const searchTerm = item.data.imagem_arquivo || item.data.nome || '';
      const normalizedSearch = normalizeString(searchTerm.split('.').shift() || '');
      
      const foundFile = files.find(f => {
        const normalizedFile = normalizeString(f.name.split('.').shift() || '');
        return normalizedFile === normalizedSearch || normalizedFile.includes(normalizedSearch) || normalizedSearch.includes(normalizedFile);
      });

      if (foundFile) {
        const previewUrl = URL.createObjectURL(foundFile);
        return {
          ...item,
          mainImageFile: foundFile,
          previewUrl,
          hasPreviewError: false
        };
      }
      return item;
    });

    setImportItems(newItems);
    setLoading(false);
    toast.success('Imagens associadas com sucesso!');
  };

  const startImport = async () => {
    const itemsWithoutImages = importItems.filter(item => !item.mainImageFile);
    if (itemsWithoutImages.length > 0) {
      toast.error(`Existem ${itemsWithoutImages.length} produtos sem imagem. Por favor, associe as imagens antes de importar.`);
      return;
    }

    const itemsWithBrokenPreviews = importItems.filter(item => item.hasPreviewError);
    if (itemsWithBrokenPreviews.length > 0) {
      toast.error(`Existem ${itemsWithBrokenPreviews.length} produtos com erro de carregamento na imagem. Verifique os arquivos.`);
      return;
    }
    
    setLoading(true);
    let successCount = 0;
    
    for (let i = 0; i < importItems.length; i++) {
      const item = importItems[i];
      if (item.status === 'success') continue;

      try {
        setImportItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'importing' } : it));
        const slug = item.data.slug || generateSlug(item.data.nome);
        const catId = await getOrCreateCategory(item.data.categoria || defaultCategoryName);

        const file = item.mainImageFile!;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `produtos/${slug}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('produtos').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('produtos').getPublicUrl(filePath);

        const payload = {
          nome: item.data.nome,
          slug,
          marca: item.data.marca || 'LOJA',
          categoria_id: catId,
          descricao: item.data.descricao || '',
          preco_original: item.data.preco_original,
          preco_atual: item.data.preco_atual,
          estoque: item.data.estoque || 10,
          ativo: true,
          destaque: true,
          novidade: true,
          imagem_principal: publicUrl,
          imagens: [publicUrl],
          midias: [{
            url: publicUrl,
            path: filePath,
            tipo: 'imagem',
            principal: true,
            ordem: 1
          }],
          updated_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase.from('produtos').insert([payload]);
        if (dbError) throw dbError;

        successCount++;
        setImportItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'success', previewUrl: publicUrl } : it));
      } catch (err: any) {
        console.error('Erro:', item.data.nome, err);
        setImportItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: err.message } : it));
      }
      setImportProgress(Math.round(((i + 1) / importItems.length) * 100));
    }

    setLoading(false);
    if (successCount === importItems.length) {
      toast.success('Todos os produtos importados com sucesso!');
      setTimeout(() => navigate('/admin/produtos'), 2000);
    }
  };

  const handleReprocessZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const toastId = toast.loading('Sincronizando imagens com o banco...');

    try {
      let imageFiles: Record<string, File> = {};
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const processed = await processZipFiles(contents);
        imageFiles = processed.imageFiles;
      } else if (file.name.toLowerCase().endsWith('.rar')) {
        const processed = await processRarFiles(file);
        imageFiles = processed.imageFiles;
      } else {
        throw new Error('Formato não suportado. Use .zip ou .rar');
      }
      
      const { data: products } = await supabase.from('produtos').select('id, nome, slug');
      
      if (!products) throw new Error('Nenhum produto encontrado no banco');

      let count = 0;
      for (const product of products) {
        const mainImageFile = findImageInList(product.slug || product.nome, imageFiles);
        if (mainImageFile) {
          const fileExt = mainImageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `produtos/${product.slug}/${fileName}`;

          const { error: uploadError } = await supabase.storage.from('product-media').upload(filePath, mainImageFile);
          if (uploadError) continue;

          const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(filePath);

          await supabase.from('produtos').update({
            imagem_principal: publicUrl,
            imagens: [publicUrl],
            midias: [{
              url: publicUrl,
              path: filePath,
              tipo: 'imagem',
              principal: true,
              ordem: 1
            }],
            ativo: true,
            destaque: true,
            novidade: true,
            estoque: 10
          }).eq('id', product.id);
          
          count++;
        }
      }

      toast.success(`${count} produtos atualizados com sucesso!`, { id: toastId });
    } catch (err: any) {
      toast.error('Erro ao reprocessar: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/produtos')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Importador Massivo</h1>
            <p className="text-sm text-gray-500 font-medium">Sincronize seu catálogo completo via ZIP.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => reprocessInputRef.current?.click()}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> REPROCESSAR COM ZIP
          </button>
          <input type="file" ref={reprocessInputRef} accept=".zip,.rar" onChange={handleReprocessZip} className="hidden" />

          {importItems.length > 0 && (
            <div className="flex gap-3">
              <button 
                onClick={() => imagesInputRef.current?.click()}
                className="px-6 py-2.5 text-sm font-bold text-[#8B3A6B] hover:bg-[#F5EEF8] border border-[#E8C4C4] rounded-xl transition-all flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" /> ASSOCIAR IMAGENS SOLTAS
              </button>
              <input type="file" ref={imagesInputRef} multiple accept="image/*" onChange={handleManualImages} className="hidden" />
              
              <button 
                onClick={startImport}
                disabled={loading || importItems.some(it => !it.mainImageFile || it.hasPreviewError)}
                className="bg-[#2D1B4E] text-white px-8 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#1a0f2e] transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                {loading ? `IMPORTANDO... ${importProgress}%` : 'INICIAR IMPORTAÇÃO'}
              </button>
            </div>
          )}
        </div>
      </div>

      {diagnostic && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Arquivos</p>
            <p className="text-2xl font-black text-[#2D1B4E]">{diagnostic.totalFiles}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Imagens Encontradas</p>
            <p className="text-2xl font-black text-green-600">{diagnostic.totalImages}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Imagens Faltando</p>
            <p className="text-2xl font-black text-red-500">{diagnostic.missingImages.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Status RAR</p>
            <p className={`text-sm font-bold ${diagnostic.rarFound ? 'text-red-500' : 'text-green-600'}`}>
              {diagnostic.rarFound ? '⚠️ RAR NO ZIP (USE O RAR DIRETO!)' : '✓ OK'}
            </p>
          </div>
          {diagnostic.missingImages.length > 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 p-4 bg-red-50 rounded-2xl">
              <p className="text-[10px] font-bold text-red-600 uppercase mb-2">Exemplos de produtos sem imagem:</p>
              <div className="flex flex-wrap gap-2">
                {diagnostic.missingImages.map((name, idx) => (
                  <span key={idx} className="px-2 py-1 bg-white border border-red-100 text-[10px] font-medium text-red-500 rounded">
                    {name}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-red-400 mt-2 italic">Dica: Os nomes no ZIP devem bater com os nomes no CSV/JSON ou com o campo 'imagem_arquivo'.</p>
            </div>
          )}
        </div>
      )}

      {importItems.length === 0 ? (
        <div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-32 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#2D1B4E] hover:bg-gray-50/50 transition-all group">
          <div className="bg-[#2D1B4E]/5 p-8 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            {extracting ? <RefreshCcw className="h-12 w-12 text-[#2D1B4E] animate-spin" /> : <Upload className="h-12 w-12 text-[#2D1B4E]" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Arraste seu ZIP ou RAR aqui</h2>
          <p className="text-gray-500 max-w-lg mb-8 text-lg font-medium">Aceita imagens em pastas, CSV/JSON e reconhece nomes automaticamente.</p>
          <input type="file" ref={fileInputRef} accept=".zip,.rar" onChange={handleFileUpload} className="hidden" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {importItems.map((item, idx) => (
            <div key={idx} className={`bg-white p-4 rounded-2xl border transition-all ${!item.mainImageFile ? 'border-red-100 bg-red-50/20' : 'border-gray-100'}`}>
              <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-50 relative border border-gray-100">
                {item.previewUrl && !item.hasPreviewError ? (
                  <img 
                    src={item.previewUrl} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={() => {
                      console.error(`Erro preview: ${item.data.nome}`);
                      setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, hasPreviewError: true } : it));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <AlertCircle className={`h-10 w-10 mb-2 ${item.hasPreviewError ? 'text-red-500' : 'text-gray-300'}`} />
                    <p className="text-[10px] font-bold uppercase">
                      {item.hasPreviewError ? 'ERRO NO ARQUIVO' : 'SEM IMAGEM'}
                    </p>
                  </div>
                )}
                {item.status === 'importing' && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-[#2D1B4E] animate-spin" />
                  </div>
                )}
                {item.status === 'success' && (
                  <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                )}
              </div>
              <h4 className="font-bold text-sm text-gray-800 truncate mb-1">{item.data.nome}</h4>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.data.categoria}</p>
                {item.status === 'error' && (
                  <div title={item.error}>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportProducts;