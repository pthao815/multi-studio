export type Language = "en" | "vi";

// Detect Vietnamese by presence of Vietnamese-specific diacritical characters
export function detectLanguage(text: string): Language {
  const vi = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;
  return vi.test(text) ? "vi" : "en";
}

export function languageInstruction(lang: Language): string {
  if (lang === "vi") {
    return "\n\nQUAN TRỌNG: Viết toàn bộ nội dung bằng tiếng Việt. Mọi câu chữ đều phải là tiếng Việt.";
  }
  return "";
}
