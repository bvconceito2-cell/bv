import { supabase } from "@/integrations/supabase/client";
import { logger } from "../lib/logger";

/**
 * Uploads a file to Supabase Storage with optional validation and logging.
 */
export const uploadToStorage = async (bucket: string, path: string, file: File) => {
  try {
    // Basic validation
    const maxSize = file.type.startsWith('video/') ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = `Arquivo muito grande: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB). Limite: ${maxSize / 1024 / 1024}MB.`;
      logger.info('Storage Upload', errorMsg);
      throw new Error(errorMsg);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: '31536000', // 1 year for production stability
      });

    if (error) {
      logger.error('Storage Upload', `Erro ao fazer upload para ${bucket}/${path}`, JSON.stringify({ detalhes: error }));
      throw error;
    }

    logger.info('Storage Upload', `Upload concluído: ${path} (${bucket})`);
    return data;
  } catch (err: any) {
    console.error(`[StorageService] Erro crítico no upload:`, err);
    throw err;
  }
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    logger.error('Storage Delete', `Erro ao deletar arquivo: ${path} (${bucket})`, JSON.stringify({ detalhes: error }));
    throw error;
  }
  logger.info('Storage Delete', `Arquivo removido: ${path} (${bucket})`);
};
