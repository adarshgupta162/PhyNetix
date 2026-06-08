// Bad word filter for English, Hindi, and Hinglish
// This is a basic implementation - can be expanded

const badWordsEnglish = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'dick', 'cock',
  'pussy', 'whore', 'slut', 'fag', 'nigger', 'cunt', 'piss', 'bullshit'
];

const badWordsHindi = [
  'chutiya', 'bhenchod', 'madarchod', 'bhosdike', 'gandu', 'lodu', 'lund',
  'chut', 'randi', 'harami', 'kamina', 'kutta', 'suar', 'gaand', 'mc', 'bc',
  'bkl', 'bsdk', 'lawde', 'jhant', 'chodu', 'tatti', 'behenchod'
];

const badWordsHinglish = [
  'chutiy', 'benchod', 'madarc', 'bhosd', 'gand', 'lod', 'lnd',
  'rnd', 'hram', 'kmina', 'kut', 'sur', 'gand', 'laude', 'jhnt', 'chod'
];

// Combine all bad words
const allBadWords = [...badWordsEnglish, ...badWordsHindi, ...badWordsHinglish];

// Create regex patterns for each word
const badWordPatterns = allBadWords.map(word => {
  // Create pattern that matches the word with possible letter substitutions
  const pattern = word
    .split('')
    .map(char => {
      // Common letter substitutions
      const subs: Record<string, string> = {
        'a': '[a@4]',
        'e': '[e3]',
        'i': '[i1!]',
        'o': '[o0]',
        's': '[s$5]',
        't': '[t7]',
        'l': '[l1]',
        'u': '[u]'
      };
      return subs[char] || char;
    })
    .join('[\\s._-]*'); // Allow spaces, dots, underscores between letters
  
  return new RegExp(pattern, 'gi');
});

export function containsBadWords(text: string): boolean {
  const normalizedText = text.toLowerCase();
  return badWordPatterns.some(pattern => pattern.test(normalizedText));
}

export function filterBadWords(text: string): string {
  let filteredText = text;
  
  badWordPatterns.forEach((pattern, index) => {
    filteredText = filteredText.replace(pattern, match => '*'.repeat(match.length));
  });
  
  return filteredText;
}

export function getBadWordsFound(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const found: string[] = [];
  
  badWordPatterns.forEach((pattern, index) => {
    if (pattern.test(normalizedText)) {
      found.push(allBadWords[index]);
    }
  });
  
  return [...new Set(found)];
}
