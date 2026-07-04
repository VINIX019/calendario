import { supabase } from "./supabaseClient";

const BUCKET = "fotos";
const MAX_DIM = 1200; // maior lado da imagem após redimensionar
const JPEG_QUALITY = 0.8;

// Comprime no navegador ANTES do upload: redimensiona para MAX_DIM e
// reexporta como JPEG. Corta consumo de storage e egress do Supabase.
export async function compressImage(file) {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > height && width > MAX_DIM) {
    height = Math.round((height * MAX_DIM) / width);
    width = MAX_DIM;
  } else if (height > MAX_DIM) {
    width = Math.round((width * MAX_DIM) / height);
    height = MAX_DIM;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  return blob;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Sobe a foto comprimida para o bucket privado. Retorna o PATH (não a URL) —
// é o path que vai na coluna foto_path / avatar_path da tabela.
export async function uploadPhoto(file, userId) {
  const blob = await compressImage(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

// Gera uma URL assinada (temporária) para exibir uma foto do bucket privado.
export async function signedUrl(path, expiresIn = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

// Versão em lote para uma lista de paths (uma chamada só).
export async function signedUrls(paths, expiresIn = 3600) {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(clean, expiresIn);
  if (error) return {};
  const map = {};
  data.forEach((row) => {
    if (row.signedUrl && !row.error) map[row.path] = row.signedUrl;
  });
  return map;
}

// Apaga um arquivo do bucket (usado ao trocar/remover foto ou excluir evento,
// pra não deixar arquivo órfão comendo o 1GB de storage).
export async function removePhoto(path) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export function formatarData(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Converte um ISO/timestamptz do banco para o formato que o input
// datetime-local aceita (YYYY-MM-DDTHH:mm em horário local). Sem isso,
// o campo de data aparece VAZIO ao editar um evento existente.
export function paraInputLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}