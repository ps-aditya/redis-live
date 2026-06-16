// frontend/src/utils/syntaxHighlight.tsx

const KEYWORDS = new Set([
  "SET", "GET", "DEL", "EXISTS", "EXPIRE", "LPUSH", "RPOP",
  "LPOP", "LLEN", "HSET", "HGET", "SADD", "SREM", "FLUSHALL",
]);

export type TokenType = "keyword" | "key" | "string" | "number" | "text";

export interface Token {
  text: string;
  type: TokenType;
}

/**
 * Tokenizes a raw command string for syntax highlighting.
 *
 * Token rules:
 *  - First word, if a known Redis command -> "keyword"
 *  - Second word (the key name)           -> "key"
 *  - Pure integers                        -> "number"
 *  - Everything else (string values)      -> "string"
 *  - Whitespace preserved as "text"
 */
export function tokenizeCommand(raw: string): Token[] {
  const tokens: Token[] = [];
  // Split but keep whitespace groups so spacing is preserved exactly
  const parts = raw.split(/(\s+)/);

  let wordIndex = 0; // counts non-whitespace words seen so far

  for (const part of parts) {
    if (part === "") continue;

    if (/^\s+$/.test(part)) {
      tokens.push({ text: part, type: "text" });
      continue;
    }

    if (wordIndex === 0) {
      const upper = part.toUpperCase();
      if (KEYWORDS.has(upper)) {
        tokens.push({ text: part, type: "keyword" });
      } else {
        tokens.push({ text: part, type: "text" });
      }
    } else if (wordIndex === 1) {
      tokens.push({ text: part, type: "key" });
    } else if (/^-?\d+$/.test(part)) {
      tokens.push({ text: part, type: "number" });
    } else {
      tokens.push({ text: part, type: "string" });
    }

    wordIndex++;
  }

  return tokens;
}

/** Maps a token type to its CSS class name */
export function tokenClass(type: TokenType): string {
  switch (type) {
    case "keyword": return "tok-keyword";
    case "key":     return "tok-key";
    case "number":  return "tok-number";
    case "string":  return "tok-string";
    default:        return "";
  }
}

/**
 * Renders a raw command string as an array of colored <span> elements.
 * Use inside any JSX that needs highlighted command text.
 */
export function HighlightedCommand({ text }: { text: string }) {
  const tokens = tokenizeCommand(text);
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={tokenClass(tok.type)}>{tok.text}</span>
      ))}
    </>
  );
}