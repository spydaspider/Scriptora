import { pipeline } from "@xenova/transformers";
import bookAliases from "../helpers/bookaliases.js";

let embedder = null;
let bookVectors = null;

// helper: average pooling
const average = (arr) => {
  const len = arr.length;
  const dim = arr[0].length;

  const result = new Array(dim).fill(0);

  for (const vec of arr) {
    for (let i = 0; i < dim; i++) {
      result[i] += vec[i];
    }
  }

  return result.map(v => v / len);
};

export const initBookEmbeddings = async () => {
  if (bookVectors) return bookVectors;

  embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  const vectors = {};

  for (const book of Object.keys(bookAliases)) {
    const output = await embedder(book);

    // output shape: [1, tokens, dim]
    vectors[book] = average(output[0]);
  }

  bookVectors = vectors;

  return bookVectors;
};

export const getBookVectors = () => bookVectors;