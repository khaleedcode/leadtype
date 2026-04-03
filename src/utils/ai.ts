// We use DummyJSON's quote API which contains ~1450 unique quotes.
// To ensure it feels instant and never repeats quickly, we'll fetch a batch of random quotes.

let cachedQuotes: string[] = [];

export const fetchGeneratedText = async (wordCountNeeded: number): Promise<string> => {
  try {
    // If we need more quotes, fetch a random batch
    if (cachedQuotes.length < 5) {
      const skip = Math.floor(Math.random() * 1400); // There are 1454 total
      const res = await fetch(`https://dummyjson.com/quotes?limit=30&skip=${skip}`);
      const data = await res.json();
      
      if (data && data.quotes) {
        // Shuffle the newly fetched quotes
        const newQuotes = data.quotes.map((q: any) => q.quote).sort(() => Math.random() - 0.5);
        cachedQuotes = [...cachedQuotes, ...newQuotes];
      }
    }

    // Accumulate enough words
    let result = '';
    while (result.split(' ').length < wordCountNeeded && cachedQuotes.length > 0) {
      const nextQuote = cachedQuotes.pop();
      if (nextQuote) {
        // make it lowercase to match monkeytype aesthetic
        result += nextQuote.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") + ' ';
      }
    }

    return result.trim() + ' ';
  } catch (error) {
    console.error("Failed to fetch generated text:", error);
    return "the api failed to load quotes so here is a fallback coherent sentence you can type out right now ";
  }
};
