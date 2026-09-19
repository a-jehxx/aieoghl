// 0, O, 1, I처럼 헷갈리는 글자를 뺀 대문자+숫자. 정확히 32자라 byte & 31로 뽑아도 치우침이 없다.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

/** 가족 공유 코드(대문자+숫자 8자리)를 암호학적 난수로 만든다. */
export function generateShareCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const b of bytes) {
    code += ALPHABET[b & 31];
  }
  return code;
}
