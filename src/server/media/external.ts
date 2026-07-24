export function validateExternalImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('请输入有效的图片 URL。');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('图片 URL 仅支持 HTTP 或 HTTPS。');
  }
  if (url.username || url.password) {
    throw new Error('图片 URL 不能包含凭据。');
  }

  return url.toString();
}
