// 从环境变量中获取基础 URL，设置默认值作为回退
const UMI_OCR_API = process.env.OCR_API_BASE_URL;

// 封装 API URL
export const API_URLS = {
	// 图片OCR （input: base64图片。output: string）
	IMAGE_BASE64_OCR: `${UMI_OCR_API}/api/ocr`,
} as const; // 使用 as const 确保对象属性为只读字面量类型