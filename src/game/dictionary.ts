/**
 * Word validation using a local word list (no API).
 * Loads public/wordlist.txt once (~460 KB, 50k words). Falls back to a small
 * embedded list if the file is missing (e.g. dev without public folder).
 */

let dictionary: Set<string> | null = null;
let loadPromise: Promise<Set<string>> | null = null;

/** Small fallback if wordlist.txt is missing – same words we had before */
const FALLBACK_WORDS = new Set([
  'act', 'add', 'age', 'aid', 'air', 'and', 'ant', 'are', 'arm', 'art', 'ate', 'bad', 'bag', 'bar', 'bat', 'bay', 'bed', 'bee', 'bet', 'big', 'box', 'boy', 'bud', 'bug', 'bus', 'but', 'buy', 'can', 'cap', 'car', 'cat', 'cod', 'cot', 'cow', 'cub', 'cup', 'cut', 'cost', 'care', 'star',
  'dad', 'day', 'den', 'did', 'die', 'dig', 'dog', 'dot', 'dry', 'ear', 'eat', 'egg', 'end', 'era', 'eye', 'fan', 'far', 'fat', 'fed', 'few', 'fig', 'fit', 'fix', 'fly', 'for', 'fox', 'fun', 'fur', 'gap', 'gas', 'get', 'god', 'got', 'gum', 'gun', 'gut', 'had', 'ham', 'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hey', 'hid', 'him', 'hip', 'his', 'hit', 'hot', 'how', 'hub', 'hug', 'hum', 'hut', 'ice', 'ill', 'its', 'jam', 'jar', 'jaw', 'jet', 'job', 'jog', 'joy', 'jug', 'key', 'kid', 'kin', 'kit', 'lab', 'lad', 'lap', 'law', 'lay', 'leg', 'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lot', 'low', 'mad', 'man', 'map', 'may', 'men', 'met', 'mid', 'mix', 'mom', 'mud', 'mug', 'nab', 'nap', 'net', 'new', 'nod', 'nor', 'not', 'now', 'nut', 'oak', 'oar', 'oat', 'odd', 'off', 'oil', 'old', 'one', 'opt', 'our', 'out', 'owe', 'owl', 'own', 'pad', 'pal', 'pan', 'pap', 'par', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pet', 'pie', 'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pow', 'pro', 'pub', 'pug', 'pun', 'pup', 'put', 'rad', 'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rug', 'rum', 'run', 'rut', 'rye', 'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea', 'see', 'set', 'sew', 'she', 'shy', 'sin', 'sip', 'sir', 'sit', 'six', 'ski', 'sky', 'sob', 'sod', 'son', 'sop', 'sow', 'spa', 'spy', 'sub', 'sum', 'sun', 'sup', 'tab', 'tad', 'tag', 'tan', 'tap', 'tar', 'tat', 'tax', 'tea', 'ted', 'tee', 'ten', 'the', 'tic', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'tot', 'tow', 'toy', 'try', 'tub', 'tug', 'two', 'use', 'van', 'vat', 'vet', 'via', 'vie', 'vow', 'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'won', 'woo', 'wow', 'yak', 'yam', 'yap', 'yaw', 'yea', 'yen', 'yep', 'yes', 'yet', 'yew', 'yum', 'yup', 'zap', 'zed', 'zip', 'zit', 'zoo',
]);

function isNonAbbreviationWord(w: string): boolean {
  // Heuristic: exclude strings with no vowel letters (a,e,i,o,u,y).
  // This removes common acronym/abbreviation-like entries (e.g. "str").
  // If you see false negatives (real words being removed), we can add an allowlist.
  return /^[a-z]+$/.test(w) && /[aeiouy]/.test(w);
}

/**
 * Curated denylist for words that appear in some wordlists but should
 * not be treated as valid in this game.
 *
 * This is intentionally small and grows as we discover false positives.
 */
const DENYLIST_WORDS = new Set<string>([
  'stra',
]);

function loadDictionary(): Promise<Set<string>> {
  if (dictionary) return Promise.resolve(dictionary);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Use Vite base URL so this works under GitHub Pages (/Dailygrid/)
      const url = `${import.meta.env.BASE_URL}wordlist.txt`;
      const res = await fetch(url, { cache: 'default' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const words = text
        .split(/\r?\n/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 3 && isNonAbbreviationWord(w) && !DENYLIST_WORDS.has(w));
      dictionary = new Set(words);
      // Ensure common game words are always included (in case wordlist omits some)
      FALLBACK_WORDS.forEach((w) => {
        if (isNonAbbreviationWord(w) && !DENYLIST_WORDS.has(w)) dictionary!.add(w);
      });
      return dictionary;
    } catch (e) {
      console.warn('Could not load wordlist.txt, using fallback:', e);
      dictionary = new Set(
        Array.from(FALLBACK_WORDS).filter(
          (w) => isNonAbbreviationWord(w) && !DENYLIST_WORDS.has(w)
        )
      );
      return dictionary;
    }
  })();

  return loadPromise;
}

/** Call early (e.g. when app mounts) so the dictionary is ready before validation runs. */
export function preloadDictionary(): Promise<Set<string>> {
  return loadDictionary();
}

/**
 * Check if a word is valid (exists in the dictionary).
 * Words under 3 letters are invalid. Loads the local word list on first use.
 */
export async function checkWord(word: string): Promise<boolean> {
  const w = word.toLowerCase().trim();
  if (w.length < 3) return false;

  const dict = await loadDictionary();
  return dict.has(w);
}
